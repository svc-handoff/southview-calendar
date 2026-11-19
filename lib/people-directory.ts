import { createHash } from 'node:crypto';
import type { MemorialPerson, RecordSource } from './memorial-records.ts';
import { readPrivateDocument, updatePrivateDocument } from './private-store.ts';

export type ImportRecord = { id: string; fileName: string; createdAt: string; added: number; duplicates: number; skipped: number; addedIds: string[]; undone?: boolean };
type Directory = { version: 1; people: MemorialPerson[]; imports: ImportRecord[] };
const empty: Directory = { version: 1, people: [], imports: [] };

function directoryPath(source: RecordSource) {
  return source === 'burial' ? 'remember/burials.json' : 'remember/people.json';
}

function normalizedName(name: string) {
  return name.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}

export function personKey(person: Omit<MemorialPerson, 'id'>) {
  const name = normalizedName(person.name);
  if (person.burialDate) return `${name}|burial:${person.burialDate}`;
  const birthKey = `${name}|${person.birthDate || ''}`;
  return person.deathDate ? `${birthKey}|death:${person.deathDate}` : birthKey;
}

export function personId(person: Omit<MemorialPerson, 'id'>) {
  return `upload-${createHash('sha256').update(personKey(person)).digest('hex').slice(0, 32)}`;
}

export async function readDirectory(source: RecordSource = 'vital') {
  return (await readPrivateDocument(directoryPath(source), empty)).data;
}

export function mergePeople(...groups: MemorialPerson[][]) {
  const unique = new Map<string, MemorialPerson>();
  for (const group of groups) for (const person of group) if (!unique.has(personKey(person))) unique.set(personKey(person), person);
  return [...unique.values()];
}
// A partial row is covered by a complete row only when its typed date
// identifies one candidate. Keep conflicting and unlinked entries separate.
export function consolidatePeople(people: MemorialPerson[]) {
  const unique = mergePeople(people);
  const completeByDate = new Map<string, number>();
  for (const person of unique) {
    if (!person.birthDate || !person.deathDate) continue;
    const name = normalizedName(person.name);
    for (const key of [`${name}|birth:${person.birthDate}`, `${name}|death:${person.deathDate}`]) {
      completeByDate.set(key, (completeByDate.get(key) ?? 0) + 1);
    }
  }
  return unique.filter((person) => {
    if (person.burialDate || (person.birthDate && person.deathDate)) return true;
    const name = normalizedName(person.name);
    const dateKey = person.birthDate ? `birth:${person.birthDate}` : `death:${person.deathDate}`;
    return completeByDate.get(`${name}|${dateKey}`) !== 1;
  });
}

export async function allPeople(source: RecordSource = 'vital') {
  return consolidatePeople((await readDirectory(source)).people);
}

export async function importPeople(input: { id: string; fileName: string; people: MemorialPerson[]; skipped: number }, source: RecordSource = 'vital') {
  return updatePrivateDocument<Directory, ImportRecord>(directoryPath(source), empty, data => {
    const previous = data.imports.find(batch => batch.id === input.id && !batch.undone);
    if (previous) return { data, result: previous };
    const known = new Set(data.people.map(personKey));
    const added: MemorialPerson[] = [];
    for (const person of input.people) if (!known.has(personKey(person))) { known.add(personKey(person)); added.push(person); }
    const batch: ImportRecord = { id: input.id, fileName: input.fileName.slice(0, 180), createdAt: new Date().toISOString(), added: added.length, duplicates: input.people.length - added.length, skipped: input.skipped, addedIds: added.map(p => p.id) };
    if (data.people.length + added.length > 200000) throw new Error('The directory is full. Contact the site administrator.');
    data.people.push(...added); data.imports = [batch, ...data.imports.filter(b => b.id !== input.id)];
    return { data, result: batch };
  });
}
export async function undoImport(id: string, source: RecordSource = 'vital') {
  return updatePrivateDocument<Directory, boolean>(directoryPath(source), empty, data => {
    const batch = data.imports.find(b => b.id === id && !b.undone);
    if (!batch) return { data, result: false };
    const ids = new Set(batch.addedIds);
    data.people = data.people.filter(p => !ids.has(p.id)); batch.undone = true;
    return { data, result: true };
  });
}

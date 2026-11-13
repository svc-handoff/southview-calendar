import { createHash } from 'node:crypto';
import type { BirthdayPerson } from './google-reminders.ts';
import { readPrivateDocument, updatePrivateDocument } from './private-store.ts';

export type ImportRecord = { id: string; fileName: string; createdAt: string; added: number; duplicates: number; skipped: number; addedIds: string[]; undone?: boolean };
type Directory = { version: 1; people: BirthdayPerson[]; imports: ImportRecord[] };
const path = 'remember/people.json';
const empty: Directory = { version: 1, people: [], imports: [] };
export function personKey(person: Pick<BirthdayPerson, 'name' | 'birthDate'>) {
  return `${person.name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')}|${person.birthDate}`;
}
export function personId(person: Pick<BirthdayPerson, 'name' | 'birthDate'>) { return `upload-${createHash('sha256').update(personKey(person)).digest('hex').slice(0, 32)}`; }
export async function readDirectory() { return (await readPrivateDocument(path, empty)).data; }
export function mergePeople(...groups: BirthdayPerson[][]) {
  const unique = new Map<string, BirthdayPerson>();
  for (const group of groups) for (const person of group) if (!unique.has(personKey(person))) unique.set(personKey(person), person);
  return [...unique.values()];
}
export async function allPeople() {
  return mergePeople((await readDirectory()).people);
}
export async function importPeople(input: { id: string; fileName: string; people: BirthdayPerson[]; skipped: number }) {
  return updatePrivateDocument<Directory, ImportRecord>(path, empty, data => {
    const previous = data.imports.find(batch => batch.id === input.id && !batch.undone);
    if (previous) return { data, result: previous };
    const known = new Set(data.people.map(personKey));
    const added: BirthdayPerson[] = [];
    for (const person of input.people) if (!known.has(personKey(person))) { known.add(personKey(person)); added.push(person); }
    const batch: ImportRecord = { id: input.id, fileName: input.fileName.slice(0, 180), createdAt: new Date().toISOString(), added: added.length, duplicates: input.people.length - added.length, skipped: input.skipped, addedIds: added.map(p => p.id) };
    if (data.people.length + added.length > 200000) throw new Error('The directory is full. Contact the site administrator.');
    data.people.push(...added); data.imports = [batch, ...data.imports.filter(b => b.id !== input.id)];
    return { data, result: batch };
  });
}
export async function undoImport(id: string) {
  return updatePrivateDocument<Directory, boolean>(path, empty, data => {
    const batch = data.imports.find(b => b.id === id && !b.undone);
    if (!batch) return { data, result: false };
    const ids = new Set(batch.addedIds);
    data.people = data.people.filter(p => !ids.has(p.id)); batch.undone = true;
    return { data, result: true };
  });
}

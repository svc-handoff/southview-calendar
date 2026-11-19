export type RecordSource = 'vital' | 'burial';
export type MemorialPerson = {
  id: string;
  name: string;
  birthDate?: string;
  deathDate?: string;
  burialDate?: string;
};

export const recordSources = ['vital', 'burial'] as const;
export type SearchSettings = Record<RecordSource, boolean>;
export const defaultSearchSettings: SearchSettings = { vital: true, burial: true };

export function isRecordSource(value: unknown): value is RecordSource {
  return value === 'vital' || value === 'burial';
}

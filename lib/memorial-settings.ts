import { defaultSearchSettings, type RecordSource, type SearchSettings } from './memorial-records.ts';
import { privateStorageConfigured, readPrivateDocument, updatePrivateDocument } from './private-store.ts';

const path = 'remember/search-settings.json';

export async function readSearchSettings(): Promise<SearchSettings> {
  if (!privateStorageConfigured() && process.env.NODE_ENV !== 'production') return defaultSearchSettings;
  return (await readPrivateDocument(path, defaultSearchSettings)).data;
}

export async function setSearchEnabled(source: RecordSource, enabled: boolean) {
  return updatePrivateDocument(path, defaultSearchSettings, (data) => {
    const settings = { ...data, [source]: enabled };
    return { data: settings, result: settings };
  });
}

import {privateStorageConfigured,readPrivateDocument,updatePrivateDocument} from './private-store.ts';

type Visibility = {hidden:boolean};
const path='site/visibility.json';
const visible:Visibility={hidden:false};

export async function readSiteVisibility():Promise<Visibility> {
  const {data}=await readPrivateDocument(path,visible);
  if(typeof data.hidden!=='boolean')throw new Error('Invalid website visibility setting.');
  return {hidden:data.hidden};
}

export async function publicSiteHidden() {
  // Keep an unconfigured local checkout usable; production must honor the
  // saved switch, including when its storage is temporarily unavailable.
  if(!privateStorageConfigured()&&process.env.NODE_ENV!=='production')return false;
  try {return (await readSiteVisibility()).hidden;}
  catch {return true;}
}

export async function setSiteVisibility(hidden:boolean) {
  return updatePrivateDocument<Visibility,Visibility>(path,visible,()=>({data:{hidden},result:{hidden}}));
}

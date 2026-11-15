'use client';
import {useEffect,useState,type ReactNode} from 'react';

export function PublicSiteGuard({initialHidden,children}:{initialHidden:boolean;children?:ReactNode}){
  const [hidden,setHidden]=useState(initialHidden);
  useEffect(()=>{
    const controller=new AbortController();
    let checking=false;
    async function check(){
      if(checking)return;checking=true;
      try{
        const response=await fetch('/api/site-status',{cache:'no-store',signal:controller.signal});
        if(!response.ok)return;
        const status=await response.json();
        if(controller.signal.aborted||typeof status.hidden!=='boolean')return;
        // A page opened while hidden has no public content from the server.
        if(initialHidden&&!status.hidden){window.location.reload();return;}
        setHidden(status.hidden);
      }catch{/* Keep the last known visibility if the connection drops. */}
      finally{checking=false;}
    }
    const interval=window.setInterval(()=>{if(document.visibilityState==='visible')void check();},10000);
    const onVisible=()=>{if(document.visibilityState==='visible')void check();};
    void check();
    window.addEventListener('focus',onVisible);document.addEventListener('visibilitychange',onVisible);
    return ()=>{controller.abort();window.clearInterval(interval);window.removeEventListener('focus',onVisible);document.removeEventListener('visibilitychange',onVisible);};
  },[initialHidden]);
  return hidden?null:children;
}

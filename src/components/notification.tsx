'use client';

import { Toast } from 'primereact/toast';
import { useEffect, useRef } from 'react';

export default function Notification() {
  const ref = useRef(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    const notify = (event: any) => {
      ref.current.show({ severity: event.detail.severity, summary: event.detail.summary, detail: event.detail.detail });
      if (event.detail.feedback) {
        audioRef.current?.play();
      }
    };
    window.addEventListener('notify', notify);
    return () => {
      window.removeEventListener('notify', notify);
    };
  }, []);

  return (
    <>
      <audio id="successAudio" src="/success.wav" preload="auto" ref={audioRef}></audio>
      <Toast ref={ref} position="top-right" />
    </>
  );
}

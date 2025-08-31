export default function notify(severity: string, summary: string, detail: string, feedback?: boolean) {
  window.dispatchEvent(
    new CustomEvent('notify', {
      detail: { severity, summary, detail, feedback },
    })
  );
}

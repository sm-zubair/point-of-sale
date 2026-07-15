const handleKotPrint = (orderNumber) => {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  iframe.style.left = '-9999px';
  iframe.style.top = '-9999px';
  iframe.src = `/kot/${orderNumber}`;
  iframe.onload = () => {
    setTimeout(() => {
      if (iframe.contentWindow) {
        const cleanUp = () => {
          document.body.removeChild(iframe);
        };
        iframe.contentWindow.print();
        iframe.contentWindow.onafterprint = cleanUp;
        setTimeout(cleanUp, 3000);
      }
    }, 500);
  };
  document.body.appendChild(iframe);
};

export default handleKotPrint;

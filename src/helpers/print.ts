const handlePrint = (orderNumber) => {
  const win = window.open(
    `/bill/${orderNumber}`,
    '_blank',
    'width=400,height=600,toolbar=no,menubar=no,scrollbars=yes,location=no,directories=no,status=no,left=200,top=150'
  );
};

export default handlePrint;

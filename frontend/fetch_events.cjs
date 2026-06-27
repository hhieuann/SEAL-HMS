fetch('http://localhost:8080/api/v1/events')
  .then(res => res.json())
  .then(console.log)
  .catch(console.error);

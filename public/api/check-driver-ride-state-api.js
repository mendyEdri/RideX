module.exports = function(rideId, driverId) {
  return fetch('https://mendy-edri-server.herokuapp.com/api/ride/getRideState', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
	    rideId: rideId,
      driverId: driverId
    })
  })
  .then((response) => response.json())
  .then((json) => {
    return {
      result: json
    }
  })
  .catch((error) => {
    return {
      error
    }
  });
}

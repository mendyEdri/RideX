module.exports = function(rideId, driverId, accept) {
  return fetch('https://mendy-edri-server.herokuapp.com/api/ride/updateRideState', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
	    rideId: rideId,
      driverId: driverId,
      accept: accept
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

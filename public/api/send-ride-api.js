module.exports = function(driverId, driverGeo, rideId, userGeo, locationString) {
  return fetch('/api/ride/sendRideToDriver', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      driverId: driverId,
	    driverGeo: driverGeo,
	    rideId: rideId,
	    geo: userGeo,
      locationString: locationString
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

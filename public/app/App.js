import _ from "lodash"

import React, { Component } from 'react';
import { Input, Button } from 'react-materialize';
import Geoautocomplete from './geo-autocomplete';
import RequestApi from '../api/request-ride';
import FindDriverApi from '../api/find-driver-api';
import SendRideApi from '../api/send-ride-api';
import GetAllDrivers from '../api/get-all-drivers-api';

import './App.css';

var googleMapsClient = require('@google/maps').createClient({
	key: 'AIzaSyDMV69WkmHWjQM9KZ7Ugo293B0mZ_4UrhA'
});

import {
  withGoogleMap,
  GoogleMap,
  Marker,
} from "react-google-maps";

class App extends Component {
	constructor(props) {
		super(props);

		this.state = {
			markers: [{
				// position: {
				// 	// lat: 25.0112183,
				// 	// lng: 121.52067570000001,
				// },
				key: `Accra`,
				defaultAnimation: 2,
			}],
			showLocationGeoList: false,
			yourLocationValue: '',
			requestRideValue: '',
			requestRideResult: '',

			findDriverValue: '',
			findDriverResult: [],

			openRideValue: '',
			openRideResult: '',
			driverId: '',
		};

		this.handleMapLoad = this.handleMapLoad.bind(this);
	  this.handleMapClick = this.handleMapClick.bind(this);
	  this.handleMarkerRightClick = this.handleMarkerRightClick.bind(this);
	  this.updateRequestRideChanges = this.updateRequestRideChanges.bind(this);
	  this.updateFindDriverChanges = this.updateFindDriverChanges.bind(this);
	  this.updateOpenRideChanges = this.updateOpenRideChanges.bind(this);
	}

  handleMapLoad(map) {
    this._mapComponent = map;
    if (map) {
      console.log(map.getZoom());

			GetAllDrivers().then((data) => {
				console.log('all drivers: ');

				var temp = [];
				for (var i = 0; i < data.result.message.length; i++) {
					console.log(data.result.message[i].geo);
					var marker = {
						position: {
							 lat: data.result.message[i].geo[0],
							 lng: data.result.message[i].geo[1],
						},
						key: data.result.message[i].phoneNumber,
						defaultAnimation: 2,
					}
					temp.push(marker);
				}
				this.setState({ markers: temp });

			});

    }
  }

  /*
   * This is called when you click on the map.
   * Go and try click now.
   */
  handleMapClick(event) {
    return;
    const nextMarkers = [
      ...this.state.markers,
      {
        position: event.latLng,
        defaultAnimation: 2,
        key: Date.now(), // Add a key property for: http://fb.me/react-warning-keys
      },
    ];
    this.setState({
      markers: nextMarkers,
    });

    if (nextMarkers.length === 3) {
      this.props.toast(
        `Right click on the marker to remove it`,
        `Also check the code!`
      );
    }
  }

  handleMarkerRightClick(targetMarker) {
    /*
     * All you modify is data, and the view is driven by data.
     * This is so called data-driven-development. (And yes, it's now in
     * web front end and even with google maps API.)
     */
    const nextMarkers = this.state.markers.filter(marker => marker !== targetMarker);
    this.setState({
      markers: nextMarkers,
    });
  }

  handleClick(e) {
     console.log(JSON.stringify(e));
     this.setState({ autoCompleteResults: [], yourLocationValue: e.description }, () => {
        this.setState({ showLocationGeoList: false });
        //drop a pin and zoom in
      });
  }

  getListItem() {
    var index = 0;
    var data = this.state.autoCompleteResults.map((result) => {
      index++;
      return (
        <tr key={index} onClick={()=>this.handleClick(result)}>
          <td className="AutoCompleteRow">{result.description}</td>
        </tr>
      );
    });
    return data;
  }

  getGeolist() {
    return (<table className="autocompleteTable">
              <tbody className="tbody">
                { this.getListItem() }
              </tbody>
            </table>);
  }

  getMapView() {
    return (
      <GettingStartedGoogleMap
          containerElement={
            <div style={MapContainer}/>
          }
          mapElement={
            <div style={MapElement}/>
          }
          onMapLoad={this.handleMapLoad}
          onMapClick={this.handleMapClick}
          markers={this.state.markers}
          onMarkerRightClick={this.handleMarkerRightClick}
        />
    );
  }

  getInputsContainer() {
    return (
      <div className="RowContainer">
        <div className="TableBody">
          <Input placeholder="Your Location" value={this.state.yourLocationValue} label="Taxi From" onChange={(event) => {
            if (!event.target.value) {
              this.setState({ autoCompleteResults: [], yourLocationValue: '' }, () => {
                this.setState({ showLocationGeoList: false });
              });
              return;
            }
            this.setState({ yourLocationValue: event.target.value }, () => {
              if (this.state.yourLocationValue.length > 2) {
                Geoautocomplete(this.state.yourLocationValue)
                .then((response) => {
                  console.log('results count: ' + response.result.message.predictions.length);
                  this.setState({ autoCompleteResults: response.result.message.predictions}, () => {
                    this.setState({ showLocationGeoList: true });
                  });
                });
              } else if (event.target.value.length === 0) {
                this.setState({ autoCompleteResults: [], yourLocationValue: '' }, () => {
                  this.setState({ showLocationGeoList: false });
                });
              }
            });
            }} />
        { this.state.showLocationGeoList ? this.getGeolist() : null }
        </div>
        <div className="TableBody">
          <Input placeholder="Destination" label="Ride To" />
        </div>
        <div>
          <Button className="request" waves='light'>Request Taxi</Button>
        </div>
      </div>
    );
  }

	getFlowViews() {
		return (
			<div style={searchContainer}>
				<div style={box}>
					<h5 style={title}>Request Ride</h5>
					<Input onChange={this.updateRequestRideChanges} />
					<Button style={searchContainerButtons} onClick={() => {
							console.log('onClick ' + this.state.requestRideValue);
							RequestApi('0526850487', this.state.requestRideValue).then((data) => {
								console.log(JSON.stringify(data.result.ride));
								this.setState({ requestRideResult: data.result.ride});
							});
					}}>Next</Button>
				<div style={responseTempText}>{ JSON.stringify(this.state.requestRideResult) }</div>
				</div>

				<br />

				<div style={box}>
					<h5 style={title}>Find Available Driver</h5>
					<Input onChange={this.updateFindDriverChanges} />
					<Button style={searchContainerButtons} onClick={() => {
							console.log('onClick ' + this.state.findDriverValue);
							var splitArray = this.state.findDriverValue.split(',');
							FindDriverApi([splitArray[0], splitArray[1]]).then((data) => {
								if (data.result.success == false || data.result.message.length == 0) {
									console.log(data.result.success == true ? "No Drivers Around" : "Error, please try again later");
									alert(data.result.success == true ? "No Drivers Around" : "Error, please try again later");
									return;
								}
								console.log(data.result.message[0].phoneNumber);
								this.setState({ findDriverResult: data.result.message[0]});
							});
					}}>Find Driver</Button>
				<div style={responseTempText}>{ JSON.stringify(this.state.findDriverResult) }</div>
				</div>

				<br />

				<div style={box}>
					<h5 style={title}>Send Ride to Driver</h5>
					<Button style={searchContainerButtons} onClick={() => {
							//(driverId, driverGeo, rideId, userGeo, locationString)
							SendRideApi(this.state.findDriverResult.phoneNumber,
													this.state.findDriverResult.geo,
													this.state.requestRideResult.rideId,
													this.state.requestRideResult.geo,
													this.state.requestRideResult.locationString).then((data) => {
								console.log(JSON.stringify(data));
								// this.setState({ rideSentResult: JSON.stringify(data) });
							});
					}}>Send Ride</Button>
				<div style={responseTempText}>{ this.state.rideSentResult }</div>
				</div>
			</div>
		);
	}

  updateRequestRideChanges(e) {
    this.setState({ requestRideValue: e.target.value });
  }

  updateFindDriverChanges(e) {
    this.setState({ findDriverValue: e.target.value });
  }

  updateOpenRideChanges(e) {
    this.setState({ openRideValue: e.target.value });
  }

	header() {
		return (
			<div style={header}>Header</div>
		);
	}

	footer() {
		return (
			<div style={footer}>Footer</div>
		);
	}

	centerBox() {
		return (<div style={centerBox}>
							<div style={leftBox}>{ this.resultList() }</div>

							<div style={rightBox}>
								<div style={box}>
									<h5 style={title}>Request Ride</h5>
									<Input style={input} placeholder={"Where to?"} onChange={this.updateRequestRideChanges} />
									<Button style={searchContainerButtons} onClick={() => {
											console.log('onClick ' + this.state.requestRideValue);
											RequestApi('0526850487', this.state.requestRideValue).then((data) => {
												console.log(JSON.stringify(data.result.ride));
												if (data.result.ride.geo.length == 2) {
													// TODO SPINNER
													FindDriverApi([data.result.ride.geo[0], data.result.ride.geo[1]]).then((data) => {
														if (data.result.success == false || data.result.message.length == 0) {
															console.log(data.result.success == true ? "No Drivers Around" : "Error, please try again later");
															alert(data.result.success == true ? "No Drivers Around" : "Error, please try again later");
															return;
														}
														this.setState({ findDriverResult: data.result.message});


														googleMapsClient.distanceMatrix({
											        origins: data.result.message[0].geo[0] + ',' + data.result.message[0].geo[0],
											        destinations: '31.987792,34.880262',
											        mode: 'driving'
											      }, function(err, response) {
											        if (err) {

											          return;
											        }
											        	console.log(response);
											      });





													});

												}
												this.setState({ requestRideResult: data.result.ride});
											});
									}}>Request Ride</Button>
								<div style={responseTempText}>{ JSON.stringify(this.state.requestRideResult.geo) }</div>
								</div>
							</div>
		</div>);
	}

	resultList() {
		if (this.state.findDriverResult.length == 0) {
			return;
		}
		var temp = [];
		for (var i = 0; i < this.state.findDriverResult.length; i++) {
			console.log(JSON.stringify(this.state.findDriverResult[i].phoneNumber));
			temp.push(
				<div style={row}>
					<div style={cardTop}>
						<div style={titleLabel}>
							{ this.state.findDriverResult[i].phoneNumber }
						</div>
					</div>
					<div style={cardBottom}>
						<Button key={i} style={rowButton}>
							Order
						</Button>
					</div>
				</div>
			);
		}
		return temp;
	}

  render() {
		//{ this.getMapView() }
		//{ this.getInputsContainer() }
		//{ this.getFlowViews() }
    return (
      <div style={AppStyle}>
				{ this.header() }
				{ this.centerBox() }
				{ this.footer() }
      </div>
    );
  }
}

const AppStyle = {
	display: 'flex',
	flexDirection: 'column',
	width: '100%',
	height: '100%',
};

const header = {
	backgroundColor: 'white',
	top: 0,
	width: '100%',
	height: '60px',
	fontSize: 40,
};

const footer = {
	backgroundColor: '#333636',
	bottom: 0,
	flex: 1,
	width: '100%',
	color: 'white',
	fontSize: 20,
	position: 'absolute',
};

const centerBox = {
	display: 'flex',
	alignSelf: 'center',
	alignItems: 'flex-end',
	justifyContent: 'flex-start',
	flexDirection: 'row',
	marginTop: '20px',
	width: '860px',
	height: '500px',
	backgroundColor: 'clear',
	'boxShadow': '10px 10px 10px 2px #0000',
};

const rightBox = {
	display: 'flex',
	alignItems: 'flex-start',
	justifyContent: 'flex-start',
	height: '500px',
	backgroundColor: 'white',
	'boxShadow': '10px 10px 10px 2px #0000',
	borderRadius: 4,
	fontSize: 30,
	flex: 4,
};

const leftBox = {
	display: 'flex',
	alignItems: 'flex-start',
	justifyContent: 'flex-start',
	flexDirection: 'column',
	height: '500px',
	backgroundColor: 'clear',
	borderRadius: 4,
	fontSize: 30,
	flex: 3,
	overflowY: 'scroll',
};

const input = {
	marginLeft: 14,
	width: '96%',
	fontSize: 20,
	textAlign: 'center',
};

const row = {
	display: 'flex',
	height: '84px',
	minHeight: '364px',
	width: '90%',
	backgroundColor: 'white',
	'boxShadow': '10px 10px 10px 2px #0000',
	borderRadius: 4,
	color: 'black',
	flexDirection: 'column',
	alignSelf: 'center',
	alignItems: 'center',
	justifyContent: 'center',
	marginBottom: '10px',
	fontSize: 16,
};

const cardTop = {
	display: 'flex',
	flex: 1,
	backgroundColor: 'white',
	width: '100%',
	justifyContent: 'center',
	alignItems: 'flex-start',
};

const cardBottom = {
	display: 'flex',
	flex: 1,
	backgroundColor: 'white',
	width: '100%',
	justifyContent: 'center',
	alignItems: 'flex-end',
};

const titleLabel = {
	margin: 10,
	fontSize: 24,
};

const line = {
	width: 200,
	height: 3,
	backgroundColor: 'red',
};

const rowButton = {
	marginBottom: 10,
};

const MapContainer = {
  flex: 1,
  margin: 0,
  backgroundColor: '#224',
  position: 'absolute',
  top: 0,
  bottom: 0,
  right: 0,
  left: 0,
};

const MapElement = {
  flex: 1,
  margin: 0,
  backgroundColor: '#222',
	position: 'absolute',
  top: 0,
  bottom: 0,
  right: 0,
  left: 0,
};

const searchContainer = {
	width: 300,
	height: 300,
	backgroundColor: '#F6F6F6',
	top: 20,
	marginLeft: 20,
	left: 0,
	position: 'absolute',
};

const box = {
	flex: 1,
	alignItems: 'center',
	justifyContent: 'center',
};

const title = {
	alignItems: 'center',
	textAlign: 'center',
};

const searchContainerButtons = {
	flex: 1,
	alignItems: 'center',
	justifyContent: 'center',
	marginLeft: 50,
};

const responseTempText = {
	fontSize: 12,
}

const GettingStartedGoogleMap = withGoogleMap(props => (
  <GoogleMap
    ref={props.onMapLoad}
    defaultZoom={15}
    defaultCenter={{ lat: 5.594752, lng: -0.194453 }}
    onClick={props.onMapClick}
  >
    {props.markers.map(marker => (
      <Marker
        {...marker}
        onRightClick={() => props.onMarkerRightClick(marker)}
      />
    ))}
  </GoogleMap>
));


export default App;

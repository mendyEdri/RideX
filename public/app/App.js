import _ from "lodash"

import React, { Component } from 'react';
import { Button, Navbar, NavItem, Icon, Preloader, Footer } from 'react-materialize';
import Geoautocomplete from '../api/geo-autocomplete';
import RequestApi from '../api/request-ride';
import FindDriverApi from '../api/find-driver-api';
import SendRideApi from '../api/send-ride-api';
import GetAllDrivers from '../api/get-all-drivers-api';
import ArrivalTime from '../api/calculate-distance-api';
import AutocompletePlacesApi from '../api/location-autocomplete-api';
import CheckDriverRideState from '../api/check-driver-ride-state-api';
import './App.css';

var request;

import {
  withGoogleMap,
  GoogleMap,
  Marker,
} from "react-google-maps";

class App extends Component {
	constructor(props, context) {
		super(props, context);

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
			requestRideValue: '',
			requestRideResult: '',

			findDriverValue: '',
			findDriverResult: [],
			placeholder: 'Where to?',
			openRideValue: '',
			openRideResult: '',
			driverId: '',
			drivers: [],
      tempDrivers: [],
      spin: false,
      requestRideSpinner: false,
		};

		this.handleMapLoad = this.handleMapLoad.bind(this);
	  this.handleMapClick = this.handleMapClick.bind(this);
	  this.handleMarkerRightClick = this.handleMarkerRightClick.bind(this);
	  this.updateRequestRideChanges = this.updateRequestRideChanges.bind(this);
	  this.updateFindDriverChanges = this.updateFindDriverChanges.bind(this);
	  this.updateOpenRideChanges = this.updateOpenRideChanges.bind(this);
		this.handleChange = this.handleChange.bind(this);
    this.hanldeMessage = this.hanldeMessage.bind(this);
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


  handleClick(i) {
		console.log(this.state.autoCompleteResults[i].description);
     this.setState({ requestRideValue: this.state.autoCompleteResults[i].description }, () => {
        this.setState({ showLocationGeoList: false, autoCompleteResults: [] });
        //drop a pin and zoom in
      });
  }

  getListItem() {
    var data = this.state.autoCompleteResults.map((result, index) => {
      return (
        <li style={AutoCompleteRow}
					key={index}
					onClick={(event) => this.handleClick(index)}
					onMouseEnter={() => {
						//this.setState({activeItem: index})
						//console.log('onMouseEnter');
					}}
					onMouseDown={(e) => {
						//e.preventDefault()
						//console.log('onMouseDown');
					}}
					onTouchStart={() => {
						//this.onTouchStart(index)
						//console.log('onTouchStart');
					}}
					onTouchMove={() => {
						//this.onTouchMove()
						//console.log('onTouchMove');
					}}
					onTouchEnd={() => {
						//this.onTouchEnd(suggestion)
						//console.log('onTouchEnd');
					}}> { result.description } </li>
      );
    });
    return data;
  }

  getGeolist() {
    return (<ul style={autocompleteTable}>
								{ this.getListItem() }
						</ul>);
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

	handleKeyDown (event) {
  	console.log('key down');
  }

  updateRequestRideChanges(e) {
    this.setState({ requestRideValue: e.target.value });
		if (String(e.target.value).length >= 2) {
			if (request) {
				request = null;
			}
			request =	AutocompletePlacesApi(String(e.target.value)).then((data) => {
	        this.setState({ autoCompleteResults: data.result.message.predictions}, () => {
	              this.setState({ showLocationGeoList: true });
	        });
			});
		} else if (event.target.value && event.target.value.length === 0) {
        this.setState({ autoCompleteResults: [] }, () => {
          this.setState({ showLocationGeoList: false });
				});
    }
  }

  updateFindDriverChanges(e) {
    this.setState({ findDriverValue: e.target.value });
  }

  updateOpenRideChanges(e) {
    this.setState({ openRideValue: e.target.value });
  }

	header() {
		return (
      <Navbar brand='Backoffice' right>
        <NavItem href='#'><Icon>search</Icon></NavItem>
        <NavItem href='#'><Icon>view_module</Icon></NavItem>
        <NavItem href='#'><Icon>refresh</Icon></NavItem>
        <NavItem href='#'><Icon>more_vert</Icon></NavItem>
      </Navbar>
		);
	}

	footer() {
		return (
      <Footer copyrights="&copy; 2015 Copyright Text"
        moreLinks={
          <a className="grey-text text-lighten-4 right" href="#!">More Links</a>
        }
        links={
          <ul>
            <li><a className="grey-text text-lighten-3" href="#!">Link 1</a></li>
            <li><a className="grey-text text-lighten-3" href="#!">Link 2</a></li>
            <li><a className="grey-text text-lighten-3" href="#!">Link 3</a></li>
            <li><a className="grey-text text-lighten-3" href="#!">Link 4</a></li>
          </ul>
        }
        className='example'>
          <h5 className="white-text">Footer Content</h5>
          <p className="grey-text text-lighten-4">You can use rows and columns here to organize your footer content.</p>
      </Footer>
		);
	}

	getDestination(destination, index) {
		if (index >= this.state.findDriverResult.length) {
        this.setState({drivers: this.state.tempDrivers });
				return;
		}

		ArrivalTime(this.state.findDriverResult[index].geo, destination).then((data) => {
			if (data.result.success == true) {
				var temp = this.state.tempDrivers;
        for (var i = 0; i < this.state.drivers.length; i++) {
          temp.push(this.state.drivers[i]);
        }
				temp.push(data.result.message);
        this.setState({ tempDrivers: temp});
				//this.setState({ drivers: temp });
			}
			index = index+1;
			this.getDestination(destination, index);
		});
	}

	handleChange(event) {
    this.setState({value: event.target.value});
  }

	centerBox() {
		return (<div style={centerBox}>
							<div style={leftBox}>{ this.resultList() }</div>
							<div style={rightBox}>
								<div style={box}>
									<h5 style={title}>Request Ride</h5>
									<input
										type="text"
										value={this.state.requestRideValue}
					          onKeyDown={(e) => {
											if (e.nativeEvent.key == "ArrowDown") {
												console.log('go down in the list');
											}
										}}
					          onKeyUp={(e) => {
											if (e.nativeEvent.key == "ArrowUp") {
												console.log('go up in the list');
											}
										}}
					          onClick={(e) => {
											//console.log('onClick');
										}}
										style={input} placeholder={this.state.placeholder} onChange={this.updateRequestRideChanges} />
									{ this.state.showLocationGeoList ? this.getGeolist() : null }
									<Button style={searchContainerButtons} onClick={() => {
                      this.setState({ requestRideSpinner: true });
											RequestApi('0526850487', this.state.requestRideValue).then((data) => {
												if (!data.result.ride) {
													console.log('location not found');
                          this.setState({ requestRideSpinner: false });
													return;
												}

                        console.log(data.result.ride);
												this.setState({ requestRideResult: data.result.ride });
												if (data.result.ride.geo.length == 2) {
													// TODO SPINNER
													var destination = data.result.ride.geo;
													FindDriverApi([data.result.ride.geo[0], data.result.ride.geo[1]]).then((data) => {
                            this.setState({ requestRideSpinner: false });
														if (data.result.success == false || data.result.message.length == 0) {
															console.log(data.result.success == true ? "No Drivers Around" : "Error, please try again later");
															alert(data.result.success == true ? "No Drivers Around" : "Error, please try again later");
															return;
														}
														this.setState({ findDriverResult: data.result.message});
														// TODO API
														this.getDestination(destination, 0);
												});
												}
											});
									}}>Request Ride</Button>
								</div>
                <div style={requestRideSpinner}><Preloader active={this.state.requestRideSpinner} size='small'/></div>
							</div>
		</div>);
	}

  checkRideIdDriverAnswer(rideId, driverId) {
    CheckDriverRideState(rideId, driverId).then((data) => {
      console.log('driver answer');
      console.log(JSON.stringify(data));
      console.log(driverId);
      if (data.result.message.ignoredDriversId.indexOf(driverId) > -1) {
        console.log('driver won\'t take the ride');
        this.setState({ spin: false });
        return;
      }
      if (data.result.message.driverId == driverId) {
        console.log('driver accepted');
        this.setState({ spin: false });
        return;
      }
      setTimeout(() => {
        this.checkRideIdDriverAnswer(rideId, driverId);
      }, 2000);
    });
  }

	handleSendDriverClick(index) {
    this.setState({ spin: true });
		SendRideApi(this.state.findDriverResult[index].phoneNumber,
								this.state.findDriverResult[index].geo,
								this.state.requestRideResult._id,
								this.state.requestRideResult.geo,
								this.state.requestRideResult.locationString).then((data) => {
			// this.setState({ rideSentResult: JSON.stringify(data) });

      // TODO add 15 sec timer, if till end, no answer from the driver, set as decliend
      console.log('rideId: ' + this.state.requestRideResult._id);
      console.log('DRIVERID: ' + this.state.findDriverResult[index].phoneNumber);
       this.checkRideIdDriverAnswer(this.state.requestRideResult._id, this.state.findDriverResult[index].phoneNumber);
		});
	}

	resultList() {
		if (this.state.findDriverResult.length == 0) {
			return;
		}
		var temp = [];
		this.state.findDriverResult.map((driver, i) => {
			temp.push(
				<div style={row} key={i}>
					<div style={cardTop}>
						<div style={titleLabel}>
							{ this.state.findDriverResult[i].phoneNumber }
						</div>
						<div style={line}>
						</div>
						<div style={driverCardTitle}>
							Driver Location:
						</div>
						<div style={driverCardDescription}>
							{ this.state.drivers.length > 0 ? this.state.drivers[i].origin_addresses : "Fetching.." }
						</div>
						<div style={driverCardTitle}>
							Passenger Location:
						</div>
						<div style={driverCardDescription}>
							{ this.state.drivers.length > 0 ? this.state.drivers[i].destination_addresses : "" }
						</div>
          <Preloader style={cardSpinner} active={this.state.spin} size='small'/>
					<div style={cardBottom}>
						<div style={grayDetails}>
							<div style={buttomDriverCard}>
								 <div style={buttomDriverCardTitle}>{ this.state.drivers.length > 0 ? this.state.drivers[i].rows[0].elements[0].duration.text : "" }</div>
								 <div style={buttomDriverCardDescription}>ETA</div>
							</div>
							<span style={{height: 22, width: 0.7, backgroundColor: '#959595'}}/>
							<div style={buttomDriverCard}>
								<div style={buttomDriverCardTitle}>{ this.state.drivers.length > 0 ? this.state.drivers[i].rows[0].elements[0].distance.text : "" }</div>
								<div style={buttomDriverCardDescription}>Distance</div>
							</div>
							</div>
						</div>
						<Button onClick={(event) => this.handleSendDriverClick(i)} key={i} style={rowButton}>
							Order
						</Button>
					</div>
				</div>
			);
		});
		return temp;
	}

  hanldeMessage(message) {
    console.log(message);
  }

  render() {
		//{ this.getMapView() }
		//{ this.getInputsContainer() }
		//{ this.getFlowViews() }
		//{ this.centerBox() }
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
	alignItems: 'flex-start',
	justifyContent: 'center',
	flexDirection: 'row',
	marginTop: '20px',
	width: '860px',
	height: (window.innerHeight - 110) + 'px',
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
	height: '100%',
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
	alignItems: 'center',
	justifyContent: 'center',
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
	flex: 5,
	backgroundColor: 'white',
	width: '100%',
	justifyContent: 'flex-start',
	alignItems: 'center',
	flexDirection: 'column',
};

const cardBottom = {
	display: 'flex',
	flex: 1,
	backgroundColor: 'white',
	width: '100%',
	justifyContent: 'center',
	alignItems: 'flex-end',
};

const grayDetails = {
	display: 'flex',
	width: '100%',
	height: '64px',
	flexDirection: 'row',
	backgroundColor: '#F9F9F9',
	marginBottom: '0',
	alignItems: 'center',
	justifyContent: 'center',
};

const titleLabel = {
	margin: 10,
	fontSize: 18,
	fontWeight: '600',
};

const line = {
	width: '80%',
	height: 1,
	backgroundColor: '#959595',
};

const rowButton = {
	marginBottom: 0,
	width: '100%',
	height: '44px',
	borderRadius: 0,
};

const autocompleteTable = {
  width: '80%',
  display: 'inline',
	alignSelf: 'center',
};

const AutoCompleteRow = {
	fontSize: 16,
	backgroundColor: 'clear',
	flexDirection: 'column',
	marginLeft: '20px',
	marginBottom: '14px',
	cursor: 'hand',
};

const driverCardTitle = {
	marginTop: '10px',
	color: '#959595',
};

const driverCardDescription = {
	fontWeight: '500',
	fontSize: '20px',

};

const buttomDriverCardTitle = {
	fontWeight: '500',
	fontSize: '20px',
	textAlign: 'center',
};

const buttomDriverCardDescription = {
	fontSize: '14px',
	fontWeight: '100',
	textAlign: 'center',

};

const buttomDriverCard = {
	alignItems: 'center',
	justifyContent: 'center',
	flex: 1,
};

const cardSpinner = {
  marginTop: 15,
};

const requestRideSpinner = {
  alignSelf: 'center',
  position: 'absolute',
  marginLeft: '220px'
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
	alignSelf: 'center',
	marginLeft: '34%',
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




 // getFlowViews() {
 //  return (
 // 	 <div style={searchContainer}>
 // 		 <div style={box}>
 // 			 <h5 style={title}>Request Ride</h5>
 // 			 <Input onChange={this.updateRequestRideChanges} />
 // 			 <Button style={searchContainerButtons} onClick={() => {
 // 					 console.log('onClick ' + this.state.requestRideValue);
 // 					 RequestApi('0526850487', this.state.requestRideValue).then((data) => {
 // 						 console.log(JSON.stringify(data.result.ride));
 // 						 this.setState({ requestRideResult: data.result.ride});
 // 					 });
 // 			 }}>Next</Button>
 // 		 <div style={responseTempText}>{ JSON.stringify(this.state.requestRideResult) }</div>
 // 		 </div>
 //
 // 		 <br />
 //
 // 		 <div style={box}>
 // 			 <h5 style={title}>Find Available Driver</h5>
 // 			 <Input onChange={this.updateFindDriverChanges} />
 // 			 <Button style={searchContainerButtons} onClick={() => {
 // 					 console.log('onClick ' + this.state.findDriverValue);
 // 					 var splitArray = this.state.findDriverValue.split(',');
 // 					 FindDriverApi([splitArray[0], splitArray[1]]).then((data) => {
 // 						 if (data.result.success == false || data.result.message.length == 0) {
 // 							 console.log(data.result.success == true ? "No Drivers Around" : "Error, please try again later");
 // 							 alert(data.result.success == true ? "No Drivers Around" : "Error, please try again later");
 // 							 return;
 // 						 }
 // 						 console.log(data.result.message);
 // 						 this.setState({ findDriverResult: data.result.message});
 // 					 });
 // 			 }}>Find Driver</Button>
 // 		 <div style={responseTempText}>{ JSON.stringify(this.state.findDriverResult) }</div>
 // 		 </div>
 //
 // 		 <br />
 //
 // 		 <div style={box}>
 // 			 <h5 style={title}>Send Ride to Driver</h5>
 // 			 <Button style={searchContainerButtons} onClick={() => {
 // 					 //(driverId, driverGeo, rideId, userGeo, locationString)
 // 					 SendRideApi(this.state.findDriverResult.phoneNumber,
 // 											 this.state.findDriverResult.geo,
 // 											 this.state.requestRideResult.rideId,
 // 											 this.state.requestRideResult.geo,
 // 											 this.state.requestRideResult.locationString).then((data) => {
 // 						 console.log(JSON.stringify(data));
 // 						 // this.setState({ rideSentResult: JSON.stringify(data) });
 // 					 });
 // 			 }}>Send Ride</Button>
 // 		 <div style={responseTempText}>{ this.state.rideSentResult }</div>
 // 		 </div>
 // 	 </div>
 //  );
 // }

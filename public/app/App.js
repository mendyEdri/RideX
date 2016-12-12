import _ from "lodash"

import React, { Component } from 'react';
import { Input, Button } from 'react-materialize';
import Geoautocomplete from './geo-autocomplete';
import RequestApi from '../api/request-ride';
import FindDriverApi from '../api/find-driver-api';
import SendRideApi from '../api/send-ride-api';

import './App.css';

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
				position: {
					lat: 25.0112183,
					lng: 121.52067570000001,
				},
				key: `Accra`,
				defaultAnimation: 2,
				showLocationGeoList: false,
				yourLocationValue: '',
				requestRideValue: '',
				requestRideResult: '',

				findDriverValue: '',
				findDriverResult: '',

				openRideValue: '',
				openRideResult: '',
				driverId: '',
			}],
		};

		// handleMapLoad = this.handleMapLoad.bind(this);
	  // handleMapClick = this.handleMapClick.bind(this);
	  // handleMarkerRightClick = this.handleMarkerRightClick.bind(this);
	  // updateRequestRideChanges = this.updateRequestRideChanges.bind(this);
	  // updateFindDriverChanges = this.updateFindDriverChanges.bind(this);
	  // updateOpenRideChanges = this.updateOpenRideChanges.bind(this);
	}

  handleMapLoad(map) {
    this._mapComponent = map;
    if (map) {
      console.log(map.getZoom());
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
            <div className="MapContainer"/>
          }
          mapElement={
            <div className="MapElement"/>
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

  updateRequestRideChanges(e) {
    this.setState({ requestRideValue: e.target.value });
  }

  updateFindDriverChanges(e) {
    this.setState({ findDriverValue: e.target.value });
  }

  updateOpenRideChanges(e) {
    this.setState({ openRideValue: e.target.value });
  }

  render() {
    // { this.getMapView() }
    // { this.getInputsContainer() }
    return (
      <div className="App">
        <div className="test">
          <h5>Request Ride</h5>
          <Input onChange={this.updateRequestRideChanges} />
          <Button onClick={() => {
              console.log('onClick ' + this.state.requestRideValue);
              RequestApi('0526850487', this.state.requestRideValue).then((data) => {
                console.log(JSON.stringify(data.result.ride));
                this.setState({ requestRideResult: data.result.ride});
              });
          }}>Request Ride</Button>
        <p>{ JSON.stringify(this.state.requestRideResult) }</p>
        </div>

        <br />

        <div className="test">
          <h5>Find Available Driver</h5>
          <Input onChange={this.updateFindDriverChanges} />
          <Button onClick={() => {
              console.log('onClick ' + this.state.findDriverValue);
              var splitArray = this.state.findDriverValue.split(',');
              FindDriverApi([splitArray[0], splitArray[1]]).then((data) => {
                if (data.result.success == false) {
                  return;
                }
                console.log(data.result.message[0].phoneNumber);
                this.setState({ findDriverResult: data.result.message[0]});
              });
          }}>Find Driver</Button>
        <p>{ JSON.stringify(this.state.findDriverResult) }</p>
        </div>

        <br />

        <div className="test">
          <h5>Send Ride to Driver</h5>
          <Button onClick={() => {
              //(driverId, driverGeo, rideId, userGeo, locationString)
              console.log(this.state.findDriverResult.phoneNumber);
              SendRideApi(this.state.findDriverResult.phoneNumber,
                          this.state.findDriverResult.geo,
                          this.state.requestRideResult.rideId,
                          this.state.requestRideResult.geo,
                          this.state.requestRideResult.locationString).then((data) => {
                console.log(JSON.stringify(data));
                // this.setState({ rideSentResult: JSON.stringify(data) });
              });
          }}>Send Ride</Button>
        <p>{ this.state.rideSentResult }</p>
        </div>
      </div>
    );
  }
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

import React from 'react';
// @ts-ignore
import {Map, Marker, TileLayer} from 'react-leaflet';
// @ts-ignore
import {Button} from '@material-ui/core';

type MapState = {
  mapOpened: Boolean
}

export class LocationDataMap extends React.Component<{}, MapState> {
  private readonly mapRef: React.RefObject<any>;
  constructor(props: Readonly<{}>) {
    super(props);
    this.mapRef = React.createRef();
    this.state = {mapOpened: false};
  }

  changeMapShowingStatus = () => {
    this.setState({mapOpened: !this.state.mapOpened});
    setTimeout(() => {
      this.mapRef.current.leafletElement.invalidateSize();
    }, 1);
  };

  render() {
    let rootStyle = {
      width: '100%',
      alignContent: 'center',
      display: 'inline-block'
    };
    let mapShowingStyle = {display: this.state.mapOpened ? 'block' : 'none'};
    let mapStyle = {
      width: '100%',
      height: '512px'
    };

    return (
      <div style={rootStyle}>
        <Button variant="contained" color="primary" onClick={() => this.changeMapShowingStatus()}>
          {this.state.mapOpened ? 'Close map' : 'Show map'}
        </Button>
        <div style={mapShowingStyle}>
          <Map
            style={mapStyle}
            center={[58.378025, 26.728493]}
            zoom={14}
            ref={this.mapRef}
          >
            <TileLayer
              url='http://{s}.tile.osm.org/{z}/{x}/{y}.png'
              attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            />
            <Marker position={[58.378025, 26.728493]}></Marker>
          </Map>
        </div>
      </div>
    );
  }
}

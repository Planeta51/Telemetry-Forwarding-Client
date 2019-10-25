import React from 'react';
// @ts-ignore
import {Paper} from '@material-ui/core';
// @ts-ignore
// eslint-disable-next-line no-unused-vars
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import LocationDataSignalData from './LocationDataSignalData';
import LocationDataParams from './LocationDataParams';
import {LocationDataMap} from './LocationDataMap';

const LocationData = () => {

  const useStyles = makeStyles((theme: Theme) =>
    createStyles({
      papers: {
        margin: theme.spacing(2),
        width: 'auto',
        display: 'flex',
        flexWrap: 'wrap'
      },
      div1: {
        width: '50%'
      },
      div2: {
        width: '50%'
      },
      div3: {
        width: '100%',
        'text-align': 'center'
      },
      break: {
        flexBasis: '100%',
        width: 0
      }
    }),
  );

  const classes = useStyles();

  return(
    <div>
      <Paper className={classes.papers}>
        <div className={classes.div1}>
          <LocationDataSignalData />
        </div>
        <div className={classes.div2}>
          <LocationDataParams />
        </div>
        <div className={classes.break}></div>
        <div className={classes.div3}>
          <LocationDataMap />
        </div>
      </Paper>
    </div>
  );
};

export default LocationData;
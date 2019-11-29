import React from 'react';
import { createStyles, Theme, withStyles } from '@material-ui/core/styles';
import { WithStyles } from '@material-ui/styles';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { CartesianGrid, Label, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Typography } from '@material-ui/core';
import DateTimePicker from './DateTimePicker';

const styles = (theme: Theme) =>
  createStyles({
    chartTitle: {
      textAlign: 'center'
    },
    root: {
      border: '1px solid',
      borderRadius: 5,
      margin: theme.spacing(1)
    },
    legend: {}
  });

interface SatelliteDataChartProps extends WithStyles<typeof styles> {
  decodedPackets: { [key: string]: { [key: string]: any }[] };
  telemetryConfiguration: { [key: string]: { [key: string]: any }[] };
  graphInfo: { [key: string]: string | number | [] };
}

type SatelliteDataChartState = {
  yAxis: any;
  chartData: { [key: string]: any }[];
  chartLineNames: string[];
  chartDomain: number;
  lineVisibility: { [key: string]: any }[];
  highlightedLine: string | null;
  toDate: string;
  fromDate: string;
};

/**
 * Component for drawing data graphs. Gets graph info and data as props.
 */
class SatelliteDataChart extends React.Component<SatelliteDataChartProps, SatelliteDataChartState> {
  constructor(props: SatelliteDataChartProps) {
    super(props);
    const { graphInfo } = this.props;
    const { yAxis } = graphInfo;
    const now = new Date();
    const anotherDate = new Date();
    const oneDayAgo = new Date(anotherDate.setDate(anotherDate.getDate() - 1));
    this.state = {
      lineVisibility: [],
      yAxis,
      chartData: [],
      chartLineNames: [],
      chartDomain: 300,
      highlightedLine: null,
      toDate: now.toISOString(),
      fromDate: oneDayAgo.toISOString()
    };
  }

  componentDidMount(): void {
    this.setChartDataWhenMounted();
  }

  setChartDataWhenMounted() {
    const { decodedPackets, telemetryConfiguration } = this.props;
    let localChartData: { [key: string]: any }[] = [];
    const { yAxis } = this.state;
    const lineNames: string[] = [];
    let chartYaxisName = '';
    let bestDomain = 0;
    decodedPackets.packets.forEach(packet => {
      const tempObject: { [key: string]: any } = {};
      const name = packet.packet_timestamp.replace('T', ' ');
      tempObject.name = name;
      tempObject.timestamp = packet.packet_timestamp;
      yAxis.forEach((yAxisValue: string) => {
        const telemetryFields: { [key: number]: any } = telemetryConfiguration.fields;
        let realValueName = '';
        Object.keys(telemetryFields).forEach((field: any) => {
          if (telemetryFields[field].id === yAxisValue) {
            chartYaxisName = telemetryFields[field].unit;
            realValueName = telemetryFields[field].label;
            if (!lineNames.includes(realValueName)) {
              lineNames.push(realValueName);
            }
          }
        });
        tempObject[realValueName] = packet.fields[yAxisValue];
        const value = parseInt(packet.fields[yAxisValue], 10);
        if (value > bestDomain) bestDomain = value;
        tempObject.unit = chartYaxisName;
      });
      localChartData.push(tempObject);
    });
    localChartData = localChartData.sort((a, b) => {
      if (a.timestamp < b.timestamp) return -1;
      if (a.timestamp > b.timestamp) return 1;
      return 0;
    });
    const visibilityTempObject = lineNames.map(lineName => {
      return { lineName, visibility: true };
    });
    this.setState({
      lineVisibility: visibilityTempObject,
      chartData: localChartData,
      chartLineNames: lineNames,
      chartDomain: bestDomain
    });
  }

  static getColor(index: number) {
    const colours = [
      '#e6194b',
      '#3cb44b',
      '#ffe119',
      '#4363d8',
      '#f58231',
      '#911eb4',
      '#46f0f0',
      '#f032e6',
      '#bcf60c',
      '#fabebe',
      '#008080',
      '#e6beff',
      '#9a6324',
      '#fffac8',
      '#800000',
      '#aaffc3',
      '#808000',
      '#ffd8b1',
      '#000075',
      '#808080',
      '#000000'
    ];
    return colours[index];
  }

  getSelectedDataInWindow() {
    const { fromDate, toDate, chartData } = this.state;
    return chartData.filter(dataElement => dataElement.timestamp <= toDate && dataElement.timestamp >= fromDate);
  }

  hideOtherLines(e: any) {
    const { lineVisibility, highlightedLine } = this.state;
    let newVisibility: { [key: string]: any }[];
    if (!highlightedLine) {
      newVisibility = lineVisibility.map(line => {
        if (line.lineName !== e.dataKey) {
          return {
            lineName: line.lineName,
            visibility: !line.visibility
          };
        }
        return line;
      });
      this.setState({ highlightedLine: e.dataKey });
    } else if (highlightedLine === e.dataKey) {
      newVisibility = this.restoreVisibility();
      this.setState({ highlightedLine: null });
    } else {
      newVisibility = lineVisibility.map(line => {
        if (line.lineName !== e.dataKey) {
          return {
            lineName: line.lineName,
            visibility: false
          };
        }
        return {
          lineName: line.lineName,
          visibility: true
        };
      });
      this.setState({ highlightedLine: e.dataKey });
    }
    this.setState({ lineVisibility: newVisibility });
  }

  restoreVisibility() {
    const { lineVisibility } = this.state;
    const newVisibility: { [key: string]: any }[] = lineVisibility.map(line => {
      return {
        lineName: line.lineName,
        visibility: true
      };
    });
    return newVisibility;
  }

  customHandle(e: any, version: string) {
    if (version === 'to') {
      this.setState({ toDate: new Date(e).toISOString() });
    } else {
      this.setState({ fromDate: new Date(e).toISOString() });
    }
  }

  renderChartDataSelection() {
    const { toDate, fromDate } = this.state;
    return (
      <>
        <DateTimePicker
          defaultValue={fromDate}
          label="From"
          dateChangeHandler={(e: any) => this.customHandle(e, 'from')}
        />
        <DateTimePicker defaultValue={toDate} label="To" dateChangeHandler={(e: any) => this.customHandle(e, 'to')} />
      </>
    );
  }

  renderLines() {
    const { chartLineNames, lineVisibility } = this.state;
    const children: any[] = [];
    chartLineNames.forEach((lineName: string, index: number) => {
      let show = false;
      lineVisibility.forEach(line => {
        if (line.lineName === lineName) {
          show = line.visibility;
        }
      });
      children.push(
        <Line
          key={lineName}
          name={lineName}
          type="monotone"
          dataKey={lineName}
          stroke={SatelliteDataChart.getColor(index)}
          strokeWidth={2}
          activeDot={{ r: 8 }}
          ref={lineName}
          opacity={show ? 1 : 0}
        />
      );
    });
    return children;
  }

  renderChart() {
    const { graphInfo, classes } = this.props;
    const { chartDomain } = this.state;
    let modifiedChartData = this.getSelectedDataInWindow();
    const modifiedDataLength = modifiedChartData.length;
    if (modifiedDataLength > 100) {
      modifiedChartData = modifiedChartData.slice(modifiedDataLength - 100, modifiedDataLength);
    }

    if (graphInfo.type === 'line') {
      return (
        <>
          <Typography className={classes.chartTitle} variant="h6">
            {graphInfo.title}
            <br />
            {this.renderChartDataSelection()}
          </Typography>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={modifiedChartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5
              }}
            >
              <CartesianGrid />
              <XAxis dataKey="name" angle={-60} textAnchor="end" scaleToFit height={150}>
                <Label value={graphInfo.xAxis} position="top" />
              </XAxis>
              <YAxis domain={[0, chartDomain]}>
                <Label
                  value={modifiedChartData.length > 0 && modifiedChartData[0] ? modifiedChartData[0].unit : ''}
                  angle={-90}
                  offset={0}
                  position="left"
                />
              </YAxis>
              <Tooltip />
              <Legend onClick={(event: any) => this.hideOtherLines(event)} />
              {this.renderLines()}
            </LineChart>
          </ResponsiveContainer>
        </>
      );
    }
    return <></>;
  }

  render() {
    const { classes } = this.props;
    return <div className={classes.root}>{this.renderChart()}</div>;
  }
}

export default withStyles(styles)(SatelliteDataChart);

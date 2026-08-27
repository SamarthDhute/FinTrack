import React from 'react';
import CountUp from 'react-countup';

export const CountUpNumber = ({ end, duration = 1, prefix = '', suffix = '' }) => (
  <CountUp start={0} end={end} duration={duration} prefix={prefix} suffix={suffix} separator="," />
);

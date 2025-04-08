<YAxis 
  tickFormatter={(value) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toFixed(0);
  }}
  interval={0}
  width={60}
  domain={['auto', 'auto']}
  scale="linear"
  allowDataOverflow={false}
  tickCount={5}
  padding={{ left: 20 }}
/> 
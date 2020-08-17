(function(root) {
  // # calculate ema
  function CalculateEMA(todaysPrice, numberOfDays, EMAYesterday) {
    k = 2 / (numberOfDays + 1);
    return todaysPrice * k + EMAYesterday * (1 - k);
  }

  function repeated_steps(o, y) {
    if (!y) return 0;
    o.ema26 = CalculateEMA(o.close, 26, y.ema26);
    o.ema12 = CalculateEMA(o.close, 12, y.ema12);
    o.macd = o.ema12 - o.ema26;
    if (y.macd && y.signal)
      o.signal = CalculateEMA(o.macd, 9, y.signal);
    else o.signal = o.macd;
    o.histogram = o.macd - o.signal;
    o.green = o.histogram > 0 ? 1 : 0;
    o.rh = o.histogram / Math.abs(o.macd);
  }

  function ema(data) {
    var yesterday;
    var emas = [];
    var drop_count = 0;
    var last_length = 0;
    var gain_count = 0;
    var last_delta = 0;
    for (i in data) {
      let keys = Object.keys(data);
      var item = data[i];
      if (i <= 3) {
        item.month = {
          ema12: item.close,
          ema26: item.close,
          close: item.close,
          macd: 0
        }
      } else {
        item.month = {
          close: item.close,
        }
        let d3 = item.close - data[keys[i - 3]].close;
        item.month_loss = d3 > 0 ? 0 : -d3;
        item.month_gain = d3 < 0 ? 0 : d3;
        repeated_steps(item.month, data[keys[i - 3]].month)
      }
      if (i <= 12) {
        item.quarter = {
          ema12: item.close,
          ema26: item.close,
          close: item.close,
          macd: 0
        }
      } else {
        item.quarter = {
          close: item.close,
        }
        let d6 = item.close - data[keys[i - 12]].close;
        item.quarter_loss = d6 > 0 ? 0 : -d6;
        item.quarter_gain = d6 < 0 ? 0 : d6;
        repeated_steps(item.quarter, data[keys[i - 12]].quarter)
      }
      if (!yesterday) {
        yesterday = {
          ema26: item.close,
          date: new Date(1000 * item.time),
          ema12: item.close,
          macd: 0,
          month: {
            ema12: item.close,
            ema26: item.close,
            close: item.close,
            macd: 0,
            loss: 0,
            gain: 0,
          },
          quarter: {
            ema12: item.close,
            ema26: item.close,
            macd: 0,
            close: item.close,
            loss: 0,
            gain: 0,
          },
          close: item.close
        }
        continue;
      }
      repeated_steps(item, yesterday)
      var delta = item.close - yesterday.close;
      item.date = new Date(1000 * item.time);
      item.loss = delta > 0 ? 0 : -delta;
      item.gain = delta < 0 ? 0 : delta;
      //monthly

      //put the calculated ema26 in an array
      if (item.histogram != undefined) {
        if (yesterday && yesterday.histogram != undefined) {
          var h1 = item.histogram - yesterday.histogram;
          //var h2 = item.histogram - data[i - 2].histogram;
          if (last_delta != undefined)
            item.direction = h1 / last_delta;
          if (last_delta == 0 || h1 == 0)
            item.direction = 0;
          last_delta = h1;
        }
      }
      if (i > 5) {
        item.v1 = item.volume
      }
      if (item.histogram >= 0) {
        if (drop_count > 0) {
          item.is_axe = true;
          last_length = drop_count;
          drop_count = 0;
        }
        gain_count += 1;
      } else {
        drop_count += 1;
        if (gain_count > 0) {
          item.is_stop = true;
          last_length = gain_count;
          gain_count = 0;
        }
      }
      item.stop = drop_count;
      item.last_length = last_length;
      item.axe = gain_count;
      if (i == (data.length - 1)) {
        item.max = gain_count;
      }
      emas.push(item);
      //make sure yesterdayEMA gets filled with the EMA we used this time around
      yesterday = item;
    }
    return emas
  }
  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = ema;
  } else {
    if (typeof define === 'function' && define.amd) {
      define([], function() {
        return ema;
      });
    } else {
      root.macd = ema;
    }
  }
})(this)
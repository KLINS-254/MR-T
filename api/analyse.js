import axios from "axios";

// EMA calculation
function calculateEMA(prices, period) {
  let k = 2 / (period + 1);
  let emaArray = [];
  emaArray[0] = prices[0];
  for (let i = 1; i < prices.length; i++) {
    emaArray[i] = prices[i] * k + emaArray[i - 1] * (1 - k);
  }
  return emaArray;
}

// RSI calculation
function calculateRSI(prices, period = 14) {
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    let diff = prices[i] - prices[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

// MACD calculation
function calculateMACD(prices, fast = 12, slow = 26, signalPeriod = 9) {
  const emaFast = calculateEMA(prices, fast);
  const emaSlow = calculateEMA(prices, slow);
  const macdLine = emaFast.map((v, i) => v - emaSlow[i]);
  const signalLine = calculateEMA(macdLine.slice(slow - 1), signalPeriod);
  const histogram = macdLine.slice(slow - 1).map((v, i) => v - signalLine[i]);
  return histogram;
}

// Bollinger Bands
function calculateBollingerBands(prices, period = 20, k = 2) {
  let bands = [];
  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);
    const avg = slice.reduce((a, b) => a + b, 0) / period;
    const std = Math.sqrt(slice.map(p => (p - avg) ** 2).reduce((a, b) => a + b, 0) / period);
    bands.push({ upper: avg + k * std, lower: avg - k * std, middle: avg });
  }
  return bands;
}

// Stochastic Oscillator
function calculateStochastic(prices, period = 14) {
  let stoch = [];
  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);
    const high = Math.max(...slice);
    const low = Math.min(...slice);
    stoch.push(((prices[i] - low) / (high - low)) * 100);
  }
  return stoch;
}

async function analyzePair(symbol, interval = "1m") {
  try {
    const response = await axios.get(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=100`
    );
    const candles = response.data.map(c => ({
      open: parseFloat(c[1]),
      high: parseFloat(c[2]),
      low: parseFloat(c[3]),
      close: parseFloat(c[4])
    }));
    const closes = candles.map(c => c.close);

    const ema50 = calculateEMA(closes, 50);
    const ema200 = calculateEMA(closes, 200);
    const rsi = calculateRSI(closes.slice(-15));
    const macdHist = calculateMACD(closes);
    const bb = calculateBollingerBands(closes);
    const stochastic = calculateStochastic(closes);

    const lastClose = candles[candles.length - 1].close;
    const prevClose = candles[candles.length - 2].close;

    // Indicator checks
    let indicatorsBuy = 0;
    let indicatorsSell = 0;
    let reasons = [];

    // EMA trend
    if (ema50[ema50.length - 1] > ema200[ema200.length - 1]) { indicatorsBuy++; reasons.push("EMA Trend Bullish"); }
    else { indicatorsSell++; reasons.push("EMA Trend Bearish"); }

    // RSI
    if (rsi >= 55 && rsi <= 65) { indicatorsBuy++; reasons.push("RSI OK"); }
    else if (rsi >= 35 && rsi <= 45) { indicatorsSell++; reasons.push("RSI OK"); }

    // MACD histogram
    const macdLast = macdHist[macdHist.length - 1];
    if (macdLast > 0) { indicatorsBuy++; reasons.push("MACD Bullish"); }
    else if (macdLast < 0) { indicatorsSell++; reasons.push("MACD Bearish"); }

    // Bollinger Bands
    const bbLast = bb[bb.length - 1];
    if (lastClose <= bbLast.lower) { indicatorsBuy++; reasons.push("Price Near Lower BB"); }
    else if (lastClose >= bbLast.upper) { indicatorsSell++; reasons.push("Price Near Upper BB"); }

    // Stochastic
    const stochLast = stochastic[stochastic.length - 1];
    if (stochLast < 20) { indicatorsBuy++; reasons.push("Stochastic Oversold"); }
    else if (stochLast > 80) { indicatorsSell++; reasons.push("Stochastic Overbought"); }

    // Determine signal based on 4+ indicator agreement
    let signal = "NO TRADE";
    let confidence = 0;
    if (indicatorsBuy >= 4) { signal = "BUY"; confidence = indicatorsBuy * 20; }
    if (indicatorsSell >= 4) { signal = "SELL"; confidence = indicatorsSell * 20; }

    return {
      pair: symbol,
      interval,
      signal,
      confidence,
      entry: "Next candle",
      expiry: "1 minute",
      reasons
    };
  } catch (error) {
    return { pair: symbol, interval, signal: "ERROR", reasons: [error.message] };
  }
}

export default async function handler(req, res) {
  const pairs = ["AUDUSDT", "USDJPY", "EURUSDT"];
  const interval = "1m";

  const results = await Promise.all(pairs.map(pair => analyzePair(pair, interval)));
  res.status(200).json(results);
    }

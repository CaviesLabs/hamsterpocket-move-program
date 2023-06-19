import { UtilsProvider } from "../client/libs/utils.provider";

describe("smart_decimals", function () {
  it("[smart_decimals] should: analyze 0.00000000002452 properly", function () {
    const verySmallDecimals = 0.00000000002452;
    const result = new UtilsProvider().analyzeDecimals(verySmallDecimals);

    expect(result.baseValue).toEqual("0");
    expect(result.totalZero).toEqual(10);
    expect(result.restValue).toEqual("2452");
    expect(result.value).toEqual(verySmallDecimals);
  });

  it("[smart_decimals] should: analyze 1.000120000000001 properly", function () {
    const verySmallDecimals = 1.000120000000001;
    const result = new UtilsProvider().analyzeDecimals(verySmallDecimals);

    expect(result.baseValue).toEqual("1");
    expect(result.totalZero).toEqual(3);
    expect(result.restValue).toEqual("120000000001");
    expect(result.value).toEqual(verySmallDecimals);
  });

  it("[smart_decimals] should: analyze 1.0001200000000010000000 properly", function () {
    const verySmallDecimals = 1.000120000000001;
    const result = new UtilsProvider().analyzeDecimals(verySmallDecimals);

    expect(result.baseValue).toEqual("1");
    expect(result.totalZero).toEqual(3);
    expect(result.restValue).toEqual("120000000001");
    expect(result.value).toEqual(verySmallDecimals);
  });
});

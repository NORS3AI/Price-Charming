import { parseCsv } from "../cards/csv-parser";

describe("parseCsv", () => {
  test("parses simple unquoted rows", () => {
    const result = parseCsv("a,b,c\n1,2,3\n4,5,6\n");
    expect(result.headers).toEqual(["a", "b", "c"]);
    expect(result.rows).toEqual([
      { a: "1", b: "2", c: "3" },
      { a: "4", b: "5", c: "6" },
    ]);
  });

  test("respects quoted fields with commas", () => {
    const result = parseCsv('a,b\n"hello, world",2\n');
    expect(result.rows[0]).toEqual({ a: "hello, world", b: "2" });
  });

  test("handles escaped double quotes inside quoted fields", () => {
    const result = parseCsv('a\n"she said ""hi"""\n');
    expect(result.rows[0]).toEqual({ a: 'she said "hi"' });
  });

  test("handles CRLF line endings", () => {
    const result = parseCsv("a,b\r\n1,2\r\n");
    expect(result.rows).toEqual([{ a: "1", b: "2" }]);
  });

  test("skips blank trailing lines", () => {
    const result = parseCsv("a,b\n1,2\n\n");
    expect(result.rows).toEqual([{ a: "1", b: "2" }]);
  });

  test("missing trailing fields default to empty string", () => {
    const result = parseCsv("a,b,c\n1,2\n");
    expect(result.rows[0]).toEqual({ a: "1", b: "2", c: "" });
  });
});

import { NS } from "@ns";
import { ansiRegex } from "/shared/logging";

export const makeTable = function (
  ns: NS,
  headers: string[],
  data: (string|number)[][],
  padding = 1,
): string {
  const getLineLength = function (
    minColWidths: number[],
    padding: number,
  ): number {
    //text length + padding each side of text + len(entries)+ seperators
    return (
      minColWidths.reduce((p, n) => {
        return p + n + 2 * padding;
      }) +
      minColWidths.length +
      3
    );
  };
  const getMinColWidth = function (rows: string[], padding: number): number {
    return rows
      .map((row) => {
        
        return row.replace(ansiRegex(),'').length;
      })
      .reduce((p, n) => {
        return Math.max(p, n + padding * 2);
      });
  };
  const makeRowSplit = function (length: number): string {
    return "-".repeat(length) + "\n";
  };

  const padCell = function (content: string, width: number): string {
    const paddingCells = width - content.replace(ansiRegex(),'').length;
    return `${" ".repeat(Math.floor(paddingCells / 2))}${content}${" ".repeat(Math.ceil(paddingCells / 2))}`;
  };

  const makeRow = function (
    values: (string|number)[],
    widths: number[],
    padding: number,
  ): string {
    const paddedCells = values.map((v, i) => {
      return `${" ".repeat(padding)}${padCell(String(v), widths[i])}${" ".repeat(padding)}`;
    });
    return `|${paddedCells.join("|")}|\n`;
  };

  const extractColumnValues = function (
    data: (string|number)[][],
    column: number,
  ): string[] {
    return data.map((r) => {
      return String(r[column]);
    });
  };

  const widths = headers.map((v, i) => {
    return getMinColWidth([v, ...extractColumnValues(data, i)], padding);
  });
  const lineLength = getLineLength(widths, padding);

  const headerRow = makeRow(headers, widths, padding);
  const seperator = makeRowSplit(lineLength);
  const dataRows = data.map((d) => {
    return makeRow(d, widths, padding);
  });
  const joinedRows = dataRows.join(`${seperator}`);
  return `\n${seperator}${headerRow}${seperator}${joinedRows}${seperator}`;
};

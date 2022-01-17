export class Util {
  private static _startDelimiter = '{';
  private static _endDelimiter = '}';

  public static set startDelimiter(value: string) {
    Util._startDelimiter = value;
  }

  // TODO calculate regex once

  public static set endDelimiter(value: string) {
    Util._endDelimiter = value;
  }
  public static replaceArgumentsWithNumbers(
    args: RegExpMatchArray | null,
    result: string
  ) {
    if (args) {
      let i = 0;
      for (let arg of args) {
        result = result.replace(
          Util._startDelimiter + i + Util._endDelimiter,
          arg
        );
        i++;
      }
    }
    return result;
  }

  public static replaceContextVariables(text: string) {
    const pattern = new RegExp(
      Util._startDelimiter + '(.*?)' + Util._endDelimiter,
      'g'
    );
    const args = text.match(pattern);

    // replace arguments with numbers
    if (args) {
      let i = 0;
      for (let arg of args) {
        text = text.replace(arg, Util._startDelimiter + i + Util._endDelimiter);
        i++;
      }
    }
    return { args, text };
  }
}

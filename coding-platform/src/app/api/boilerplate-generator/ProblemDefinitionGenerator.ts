export class ProblemDefinitionParser {
  problemName: string = "";
  functionName: string = "";
  inputFields: { type: string; name: string }[] = [];
  outputFields: { type: string; name: string }[] = [];

  parse(input: string): void {
    const lines = input.split("\n").map((line) => line.trim());

    let currentSection: string | null = null;

    lines.forEach((line) => {
      if (line.startsWith("Problem Name:")) {
        this.problemName = this.extractQuotedValue(line);
      } else if (line.startsWith("Function Name:")) {
        this.functionName = this.extractValue(line);
      } else if (line.startsWith("Input Structure:")) {
        currentSection = "input";
      } else if (line.startsWith("Output Structure:")) {
        currentSection = "output";
      } else if (line.startsWith("Input Field:")) {
        if (currentSection === "input") {
          const field = this.extractField(line);
          if (field) this.inputFields.push(field);
        }
      } else if (line.startsWith("Output Field:")) {
        if (currentSection === "output") {
          const field = this.extractField(line);
          if (field) this.outputFields.push(field);
        }
      }
    });
  }

  extractQuotedValue(line: string): string {
    const match = line.match(/: "(.*)"$/);
    return match ? match[1] : "";
  }

  extractValue(line: string): string {
    const match = line.match(/: (\w+)$/);
    return match ? match[1] : "";
  }

  extractField(line: string): { type: string; name: string } | null {
    const match = line.match(/Field: (\w+(?:<\w+>)?) (\w+)$/);
    return match ? { type: match[1], name: match[2] } : null;
  }

  generateCpp(): string {
    const inputs = this.inputFields
      .map((field) => `${field.type} ${field.name}`)
      .join(", ");
    return `${this.outputFields[0].type} ${this.functionName}(${inputs}) {\n    // Implementation goes here\n    return result;\n}`;
  }

  generateJs(): string {
    const inputs = this.inputFields.map((field) => field.name).join(", ");
    return `function ${this.functionName}(${inputs}) {\n    // Implementation goes here\n    return result;\n}`;
  }


}

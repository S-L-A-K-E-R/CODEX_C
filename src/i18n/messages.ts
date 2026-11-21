import french from "./fr.json";
export type Language = "en" | "fr";
export type Values = Record<string, string | number>;
const messages: Readonly<Record<string, string>> = french;

// Worker messages keep their protocol language. Translate only app-owned status text.
const statuses: [RegExp, string, string[]][] = [
  [/^Running (\d+) of (\d+)$/, "Running {i} of {n}", ["i", "n"]],
  [/^Case (\d+)$/, "Case {n}", ["n"]],
  [
    /^Program stopped · exit code ([-\d?]+)$/,
    "Program stopped · exit code {n}",
    ["n"],
  ],
  [
    /^Could not load ([\w.-]+)\. Check your connection, then try again\.$/,
    "Could not load {name}. Check your connection, then try again.",
    ["name"],
  ],
  [
    /^Invalid (completed|lessons|milestones|activity|attempts) in backup\.$/,
    "Invalid {field} in backup.",
    ["field"],
  ],
  [
    /^Invalid (completed|lessons|milestones|activity|attempts) entry\.$/,
    "Invalid {field} entry.",
    ["field"],
  ],
];
export function translate(
  language: Language,
  message: string,
  values?: Values,
): string {
  if (language === "fr" && !Object.hasOwn(messages, message)) {
    for (const [pattern, key, names] of statuses) {
      const match = message.match(pattern);
      if (match)
        return translate(
          language,
          key,
          Object.fromEntries(names.map((name, i) => [name, match[i + 1]])),
        );
    }
  }
  const template =
    language === "fr" && Object.hasOwn(messages, message)
      ? messages[message]
      : message;
  return values
    ? template.replace(/\{(\w+)\}/g, (token, key: string) =>
        String(values[key] ?? token),
      )
    : template;
}

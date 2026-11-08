export type NameSet = { label: string; first: string[]; last: string[] };

export const NAME_SETS: Record<string, NameSet> = {
  human: {
    label: "Mensch",
    first: ["Aldric", "Berta", "Cedric", "Dorothea", "Edmund", "Frieda", "Gerwin", "Hilda", "Ivo", "Jorun", "Konrad", "Lioba", "Magnus", "Nora", "Osric", "Petra", "Roland", "Sigrid", "Tilda", "Ulrich", "Wulf", "Yrsa"],
    last: ["Eisenhand", "Weidenbach", "Steinmetz", "Rabenfels", "Kornblum", "Hartmann", "Schwarzmoor", "Falkenrath", "Brandt", "Nachtigall", "Birkenhain", "Kupferstein"],
  },
  elf: {
    label: "Elf",
    first: ["Aelindra", "Caelith", "Faenor", "Ilyana", "Thalion", "Sylvaris", "Elowen", "Vaeril", "Lirael", "Naerion", "Miriel", "Taurion"],
    last: ["Mondflüstern", "Sternenpfad", "Silberlaub", "Morgenglanz", "Windsang", "Nebelweber", "Sonnenhain"],
  },
  dwarf: {
    label: "Zwerg",
    first: ["Borin", "Dagna", "Thrain", "Helga", "Gimra", "Orsik", "Kildrak", "Brunhild", "Torbek", "Vistra", "Balin", "Dessa"],
    last: ["Eisenbart", "Felsbrecher", "Goldader", "Steinhammer", "Tiefenschmied", "Amboss", "Kupferkessel"],
  },
  halfling: {
    label: "Halbling",
    first: ["Pip", "Rosie", "Merry", "Linda", "Cade", "Nedda", "Perrin", "Seraphina", "Wellby", "Lidda", "Milo", "Tansy"],
    last: ["Grünhügel", "Dornbusch", "Apfelbaum", "Tiefental", "Teekessel", "Weichfuß", "Honigtopf"],
  },
  orc: {
    label: "Ork",
    first: ["Grosh", "Mogra", "Thokk", "Uzgul", "Varka", "Dench", "Krull", "Shargaz", "Baggi", "Ront", "Yurk", "Ghazi"],
    last: ["Knochenbrecher", "Blutaxt", "Schädelspalter", "Eisenzahn", "der Grimmige", "Narbenfaust", "Rabenfresser"],
  },
};

export const TAVERNS = [
  "Zum goldenen Greif",
  "Zur müden Harfe",
  "Zum rostigen Kessel",
  "Zum durstigen Zwerg",
  "Zur tanzenden Eule",
  "Zum schiefen Turm",
  "Zur letzten Fackel",
  "Zum grinsenden Kobold",
  "Zur schwarzen Katze",
  "Zum einäugigen Raben",
  "Zum sprechenden Pilz",
  "Zur gläsernen Krone",
  "Zum blauen Eber",
  "Zur knarrenden Planke",
  "Zum wilden Einhorn",
  "Zum betrunkenen Drachen",
  "Zur verlorenen Laterne",
  "Zum schlafenden Riesen",
];

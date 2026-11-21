/**
 * 15 distinct, hand-authored ASCII worlds. Every tile and road is a character.
 * Coordinates use zero-based columns/rows (not pixel positions).
 * Cores, side branches, and the final node can vary by chapter.
 */
export type CellPoint = readonly [column: number, row: number];
export type RouteTurn = "horizontal" | "vertical";
export type ChapterMap = {
  name: string;
  nameFr: string;
  biome: string;
  art: string;
  cores: readonly CellPoint[];
  sides: readonly CellPoint[];
  sideOrigins: readonly number[];
  turns: readonly RouteTurn[];
};
const maps: Record<string, ChapterMap> = {
  "first-programs": {
    "name": "STARTER MEADOW",
    "nameFr": "PRAIRIE DU DEPART",
    "biome": "meadow",
    "art": "\n  .    .       T T  T            .  .      T T         .     \n    .        T T T T          .         .   T     .          \n .      .     T T T       .                .        .       \n        .         .             o       .             .     \n     .         T T          .       .        .        .     \n  T        .   T T    .                        T      .    \n  T T   .             .            .     .      T         \n  T        .          .     o                  .             \n    .        T T            .           .             T     \n          .   T T     .      .            .      .    T     \n       .                 .           T  .               .  \n     .         o               .      T    .        .       \n   T     .         .          .            .    o    .      \n  T T           .    .             .                 .       \n       .            .       .          .       T             \n    .        .             o       .             T     .    \n       T           .           .       .   .           .    \n    .       .  .             .           .         .         \n       .    T T           .         T T          .    .      \n     .       T          .           T T                .    \n   .          .             .             .       .         \n",
    "cores": [
      [
        17,
        6
      ],
      [
        34,
        12
      ],
      [
        49,
        6
      ]
    ],
    "sides": [
      [
        24,
        18
      ],
      [
        54,
        17
      ],
      [
        36,
        20
      ]
    ],
    "sideOrigins": [
      0,
      2,
      1
    ],
    "turns": [
      "horizontal",
      "vertical",
      "horizontal",
      "vertical"
    ]
  },
  "variables": {
    "name": "CLOCKWORK VILLAGE",
    "nameFr": "VILLAGE DES HORLOGES",
    "biome": "village",
    "art": "\n         +------+                     +-------+              \n  .      | []   |        .            | [12]  |       .      \n    .    | []   |                     |   o   |              \n         +------+                     +-------+        .     \n           .             o          .                      \n      .            .                 .       +----+          \n  +-----+          +----+               .    | [] |          \n  | []  |    .     | [] |     .               | [] |          \n  |  [] |          | [] |                     +----+          \n  +-----+          +----+        o                  .       \n         .                   .            .                  \n    .          o                     +------+                \n  +-----+                 .          | [==] |        .       \n  | []  |       .                    | [==] |                \n  +-----+                          . +------+               \n          .           +------+                   .          \n     .                |  []  |          o                   \n             .        |  []  |              .               \n                      +------+          .                   \n    o        .                    .            .            \n      .                .              +----+            .    \n",
    "cores": [
      [
        18,
        14
      ],
      [
        37,
        7
      ],
      [
        52,
        14
      ]
    ],
    "sides": [
      [
        30,
        18
      ],
      [
        56,
        5
      ],
      [
        14,
        5
      ]
    ],
    "sideOrigins": [
      0,
      1,
      0
    ],
    "turns": [
      "horizontal",
      "horizontal",
      "vertical",
      "vertical"
    ]
  },
  "decisions": {
    "name": "THE CROSSROADS",
    "nameFr": "LES CARREFOURS",
    "biome": "hedge",
    "art": "\n  ######################################         .           \n  #       #            #             ##                    \n  #  .    #     .      #      .      ##      .            \n  #       #            #             ##               .     \n  #   ######      ##########         ##                    \n  #                    #             ##           .        \n  #####        #####   #     ##########     .              \n  #       .        #   #             ##                  \n  #                #   #      .      ##        .            \n  #   ##############       ######    ##                  \n  #                            #     ##           .         \n  ########      ######    #######    ##                     \n  #                 #                ##      .              \n  #    .            #      .         ##                    \n  ######       #######             ####         .           \n  #                 #                ##           .         \n  #       .         #          .     ##                    \n  ###########   ##########           ##   .                 \n       .          .               .             .           \n    .       .              .             .           .     \n",
    "cores": [
      [
        18,
        5
      ],
      [
        35,
        12
      ],
      [
        54,
        7
      ]
    ],
    "sides": [
      [
        13,
        17
      ],
      [
        48,
        18
      ],
      [
        61,
        16
      ]
    ],
    "sideOrigins": [
      0,
      2,
      2
    ],
    "turns": [
      "vertical",
      "horizontal",
      "vertical",
      "horizontal"
    ]
  },
  "loops": {
    "name": "THE WINDING RIVER",
    "nameFr": "LA RIVIERE SINUEUSE",
    "biome": "river",
    "art": "\n  T    .        ~~~~~              T     .         T         \n     T        ~~~  ~~~           T          T         .      \n    .       ~~~      ~~~           .                T        \n         ~~~~          ~~     T          .                   \n     T    ~~~         ~~~               T         .        \n          ~~~           ~~~~      .              T           \n   .       ~~~        ~~~~                .                  \n             ~~~~    ~~~        T               .            \n   T    .      ~~~~~~~~       .             T               \n          .       ~~~~              .               T        \n     T        .  ~~~~        .                  .            \n                ~~~  ~~~            T       .              \n   T    .     ~~~    ~~~~               .             T      \n           ~~~~         ~~~         .           T            \n    .    ~~~             ~~~                .                \n      ~~~~          T     ~~~~        .               T     \n    ~~~~       .             ~~~           T                  \n    ~~~             T         ~~~~              .           \n  ~~~~~        .                 ~~~~       T                 \n    ~~~~           .               ~~~~~~~~        .         \n     ~~~~~               .            ~~~~~~~~       T      \n",
    "cores": [
      [
        18,
        5
      ],
      [
        37,
        10
      ],
      [
        54,
        5
      ]
    ],
    "sides": [
      [
        25,
        18
      ],
      [
        57,
        17
      ],
      [
        39,
        20
      ],
      [
        11,
        17
      ]
    ],
    "sideOrigins": [
      0,
      2,
      1,
      0
    ],
    "turns": [
      "vertical",
      "horizontal",
      "vertical",
      "horizontal"
    ]
  },
  "arrays": {
    "name": "THE ISLAND CHAIN",
    "nameFr": "L'ARCHIPEL",
    "biome": "island",
    "art": "\n  ~~~~~~~~~~~~             ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n  ~~~  . . . . . .        ~~~~~~~~~~~~~~~       . . .   ~~~~~\n  ~~  .    T      .        ~~~~~~~~~~~~        .   T .   ~~~~\n  ~~ .    T T      .          ~~~~~~~~        .      .   ~~~~\n  ~~~ .    T   .  .     ~~~~~~~~~~~~        .   T    .  ~~~~\n  ~~~~~  . . . . . .  ~~~~~~~~~~~~~~~         . . . .   ~~~~~\n  ~~~~~~~~~~~~~~~~~~~            ~~~~~~~~~~~~~~~~~~~~~~~~~~~\n  ~~~~~~~~~  . . . .  ~~~~           . . . .  ~~~~~~~~~~~~~~~\n  ~~~~~~~  .       .    ~~         .       .  ~~~~~~~~~~~~~~\n  ~~~~~  .   T T    .   ~~        .    T    .   ~~~~~~~~~~~~\n  ~~~~~  .    T     .  ~~~~       .   T T   .   ~~~~~~~~~~~~\n  ~~~~~~  . . . . . .  ~~~~~~~~     . . . . .    ~~~~~~~~~~~~~\n  ~~~~~~~~~~~~~~~~~~~~~~~~~~          ~~~~~~~~~~~~~~~~~~~~~~\n  ~~~~~~       . . . .   ~~~    . . . .        ~~~~~~~~~~~~~~\n  ~~~~~   . . .     .    ~~    .      .     ~~~~~~~~~~~~~~~~\n  ~~~~   .   T    T  .    ~~   .   T   .       ~~~~~~~~~~~~~\n  ~~~~~  .    T T    .  ~~~~    . . . .         ~~~~~~~~~~~~~\n  ~~~~~~  . . . . . .  ~~~~~~~~~      ~~~~~~~~~~~~~~~~~~~~~~~\n  ~~~~~~~~~~~~~~~~~~~~~~~~    . . .    ~~~~~~~~~~~~~~~~~~~~~~\n  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~        ~~~~~~~~~~~~~~~~~~~~\n",
    "cores": [
      [
        17,
        4
      ],
      [
        35,
        11
      ],
      [
        53,
        5
      ]
    ],
    "sides": [
      [
        18,
        18
      ],
      [
        53,
        18
      ],
      [
        38,
        19
      ]
    ],
    "sideOrigins": [
      0,
      2,
      1
    ],
    "turns": [
      "vertical",
      "horizontal",
      "vertical",
      "horizontal"
    ]
  },
  "functions": {
    "name": "THE LIBRARY DISTRICT",
    "nameFr": "QUARTIER DES BIBLIOTHEQUES",
    "biome": "library",
    "art": "\n   +--------+       +--------+            +--------+        \n   | [====] |       | [====] |     .      | [====] |        \n   | [====] |       | [====] |            | [====] |        \n   +--------+       +--------+            +--------+         \n             .                  .                 .         \n    +------+              +------+      .                    \n    | |||| |      .       | |||| |               +------+     \n    | |||| |              | |||| |               | |||| |     \n    +------+              +------+               +------+     \n             .           .        .          .              \n    +--------+       +--------+           +--------+          \n    | [====] |       | [====] |           | [====] |         \n    | [====] |       | [====] |    .      | [====] |         \n    +--------+       +--------+           +--------+          \n            .                     .              .           \n    +------+             +------+         +------+          \n    | |||| |        .    | |||| |         | |||| |           \n    | |||| |             | |||| |   .     | |||| |           \n    +------+             +------+         +------+          \n         .           .             .            .           \n       .                .                .              .    \n",
    "cores": [
      [
        16,
        9
      ],
      [
        35,
        5
      ],
      [
        53,
        13
      ]
    ],
    "sides": [
      [
        23,
        18
      ],
      [
        55,
        19
      ],
      [
        12,
        20
      ]
    ],
    "sideOrigins": [
      0,
      2,
      0
    ],
    "turns": [
      "horizontal",
      "vertical",
      "vertical",
      "horizontal"
    ]
  },
  "pointers": {
    "name": "THE MOUNTAIN PASS",
    "nameFr": "LE COL DES MONTAGNES",
    "biome": "mountain",
    "art": "\n  ^^^^^   ^^^^^^^                  ^^^^      ^^^^^^^          \n  ^^^^^^^^^^^^^^         ^^^^^^^^^^^^^     ^^^^^^^^^^       \n  ^^^^^    ^^^^^         ^^^^^^^^^^^^^^^     ^^^^^^^        \n   ^^^       ^^           ^^^     ^^^^^        ^^^          \n    ^^            ^^^            ^^^^            ^^^^^       \n  ^^^^^       ^^^^^^^^^        ^^^^^^^          ^^^^^^^     \n  ^^^^^         ^^^^^^          ^^^^^^^           ^^^^^      \n   ^^^           ^^^                ^^            ^^^        \n       ^^^              ^^^        ^^^^^^^              ^^^  \n      ^^^^^     ^^^    ^^^^^         ^^^^^        ^^^  ^^^^^ \n   ^^^^^^^     ^^^^^   ^^^^^^^       ^^^^^       ^^^^^  ^^^^\n   ^^^^^        ^^^     ^^^^^         ^^^        ^^^^^      \n           ^^^            ^^^         ^^^^          ^^       \n   ^^^    ^^^^^      ^^^   ^^^^       ^^^^^         ^^^^^    \n  ^^^^^    ^^^      ^^^^^   ^^^^^     ^^^^^         ^^^^^^  \n  ^^^^^             ^^^^^              ^^            ^^^    \n      ^^^^            ^^^^         ^^^^           ^^^^      \n    ^^^^^^       ^^^^             ^^^^^^^        ^^^^^^^     \n    ^^^^^^      ^^^^^^^            ^^^^^^^         ^^^      \n     ^^^        ^^^^^^              ^^^^^          ^^^      \n  ^^^^           ^^^            ^^^^^^            ^^^^^     \n",
    "cores": [
      [
        16,
        8
      ],
      [
        34,
        16
      ],
      [
        52,
        8
      ]
    ],
    "sides": [
      [
        27,
        5
      ],
      [
        59,
        18
      ],
      [
        40,
        20
      ]
    ],
    "sideOrigins": [
      0,
      2,
      1
    ],
    "turns": [
      "vertical",
      "vertical",
      "horizontal",
      "horizontal"
    ]
  },
  "strings": {
    "name": "THE ORCHARD MAZE",
    "nameFr": "LE VERGER LABYRINTHE",
    "biome": "orchard",
    "art": "\n  T  T  T  T  T    T  T  T  T  T     T  T  T  T  T           \n    o       o           o                o       o          \n  T  T  T  T  T    T  T  T  T  T     T  T  T  T  T           \n      .            .           .           .                 \n  T  T  T  T  T    T  T  T  T  T     T  T  T  T  T           \n    o       o           o                o       o          \n  T  T  T  T  T    T  T  T  T  T     T  T  T  T  T           \n     .             .            .           .               \n  T  T  T  T  T    T  T  T  T  T     T  T  T  T  T           \n         o              o            o           o          \n  T  T  T  T  T    T  T  T  T  T     T  T  T  T  T           \n     .           .              .             .             \n  T  T  T  T  T    T  T  T  T  T     T  T  T  T  T           \n     o          o         o               o                 \n  T  T  T  T  T    T  T  T  T  T     T  T  T  T  T           \n           .             .           .         .            \n  T  T  T  T  T    T  T  T  T  T     T  T  T  T  T           \n      o       o           o            o         o          \n  T  T  T  T  T    T  T  T  T  T     T  T  T  T  T           \n       .             .            .           .            \n",
    "cores": [
      [
        17,
        5
      ],
      [
        37,
        14
      ],
      [
        54,
        7
      ]
    ],
    "sides": [
      [
        22,
        18
      ],
      [
        52,
        18
      ],
      [
        40,
        4
      ]
    ],
    "sideOrigins": [
      0,
      2,
      1
    ],
    "turns": [
      "horizontal",
      "vertical",
      "horizontal",
      "vertical"
    ]
  }
};
export const CHAPTER_MAPS: Readonly<Record<string, ChapterMap>> = maps;
export const chapterMapFor = (id: string): ChapterMap => maps[id] ?? maps["first-programs"];

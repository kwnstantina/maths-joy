export const TAGS = 
  {
    byId: {
      0: {
        id: 0,
        name: "",
        title: "title",
        unavailable: true,
      },
      1: {
        id: 1,
        name: "Α-Λυκείου",
        title: "title",
        unavailable: false,
      },
      2: {
        id: 2,
        name: "Β-Λυκείου",
        title: "title",
        unavailable: false,
      },
      3: {
        id: 3,
        name: "Γ-Λυκείου",
        title: "title",
        unavailable: false,
      },
      4: {
        id: 4,
        name: "Γυμνάσιο",
        title: "title",
        unavailable: false,
      },
      5: {
        id: 5,
        name: "Πανεπιστημιακά Μαθηματικά",
        title: "title",
        unavailable: false,
      },
    },
    allIds: [0, 1, 2, 3, 4, 5],
  };

export const Category = 
  {
    byId: {
      0: {
        id: 0,
        name: "",
        title: "category",
        unavailable: true,
      },
      1: {
        id: 1,
        name: "Συναρτήσεις",
        title: "category",
        unavailable: false,
      },
      2: {
        id: 2,
        name: "Όρια",
        title: "category",
        unavailable: false,
      },
      3: {
        id: 3,
        name: "Παράγωγοι",
        title: "category",
        unavailable: false,
      },
      4: {
        id: 4,
        name: "Ολοκληρώματα",
        title: "category",
        unavailable: false,
      },
      5: {
        id: 5,
        name: "Άλγεβρα",
        title: "category",
        unavailable: false,
      },
      6: {
        id: 6,
        name: "Γεωμετρία",
        title: "category",
        unavailable: false,
      },
      7: {
        id: 7,
        name: "Πανεπιστημιακά Μαθηματικά",
        title: "category",
        unavailable: false,
      },
    },
    allIds: [0, 1, 2, 3, 4, 5, 6, 7],
  }

export const Type = 
  {
    byId: {
      0: {
        id: 0,
        name: "",
        title: "tags",
        unavailable: true,
      },
      1: {
        id: 1,
        name: "Άλυτες ασκήσεις",
        title: "tags",
        unavailable: false,
      },
      2: {
        id: 2,
        name: "Λυμένες ασκήσεις",
        title: "tags",
        unavailable: false,
      },
      3: {
        id: 3,
        name: "Ερωτήσεις Επιλογής",
        title: "tags",
        unavailable: false,
      },
    },
    allIds: [0, 1, 2, 3],
  };


export const ExerciseNavList = [
  {
    id: 1,
    title: "Γ-Λυκείου",
    subTitles: [
      {
        id: 11,
        title: "Πολλαπλής επιλογής",
        link: "?searchParam=g1",
      },
      {
        id: 12,
        title: "Λυμένες ασκήσεις",
        link: "?searchParam=g2",
      },
    ],
  },
  {
    id: 2,
    title: "Β-Λυκείου",
    subTitles: [
      {
        id: 21,
        title: "Πολλαπλής επιλογής",
        link: "?searchParam=b1",
      },
      {
        id: 22,
        title: "Λυμένες ασκήσεις",
        link: "?searchParam=b2",
      },
    ],
  },
  {
    id: 3,
    title: "A-Λυκείου",
    subTitles: [
      {
        id: 31,
        title: "Πολλαπλής επιλογής",
        link: "?searchParam=a1",
      },
      {
        id: 32,
        title: "Λυμένες ασκήσεις",
        link: "?searchParam=a2",
      },
    ],
  },
  {
    id: 4,
    title: "Γυμνάσιο",
    subTitles: [
      {
        id: 41,
        title: "Πολλαπλής επιλογής",
        link: "?searchParam=s1",
      },
      {
        id: 42,
        title: "Λυμένες ασκήσεις",
        link: "?searchParam=s2",
      },
    ],
  },
  {
    id: 5,
    title: "Πανεπιστήμιο",
    subTitles: [
      {
        id: 51,
        title: "Πολλαπλής επιλογής",
        link: "?searchParam=p1",
      },
      {
        id: 52,
        title: "Λυμένες ασκήσεις",
        link: "?searchParam=p2",
      },
    ],
  },
];

export const staticImages: Array<any> = [
  {
    cover_photo: {
      urls: {
        regular:
          "https://i.pinimg.com/564x/d0/91/97/d09197202480d002273b332d379c57a7.jpg",
      },
    },
  },
  {
    cover_photo: {
      urls: {
        regular:
          "https://i.pinimg.com/564x/0d/4a/a1/0d4aa16fe31dba498c27f3850cdf0e80.jpg",
      },
    },
  },
  {
    cover_photo: {
      urls: {
        regular:
          "https://i.pinimg.com/564x/c8/08/de/c808dec90b152b59edee8ccb23e46f0a.jpg",
      },
    },
  },
  {
    cover_photo: {
      urls: {
        regular:
          "https://i.pinimg.com/564x/88/f0/50/88f050f61e9bb02f958a6bf436a60ab5.jpg",
      },
    },
  },
  {
    cover_photo: {
      urls: {
        regular:
          "https://i.pinimg.com/564x/0c/2b/44/0c2b446aebb58f16332b4e12913c3340.jpg",
      },
    },
  },
  {
    cover_photo: {
      urls: {
        regular:
          "https://i.pinimg.com/564x/06/ef/59/06ef59011706ed98209ff1f3d946a374.jpg",
      },
    },
  },
];

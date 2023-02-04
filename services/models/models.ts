export const TAGS = [
  {
    id: 0,
    name: 'Ταξη',
    title: "title",
    unavailable: true,
  },
  {
    id: 1,
    name: "Α-Λυκειου",
    title: "title",
    unavailable: false,
  },
  {
    id: 2,
    name: "Β-Λυκειου",
    title: "title",
    unavailable: false,
  },
  {
    id: 3,
    name: "Γ-Λ υκειου",
    title: "title",
    unavailable: false,
  },
  { id: 4, name: "Γυμνάσιο", 
  title: "title" ,
  unavailable: false
  },
  {
    id: 5,
    name: "Πανεπιστήμιακά Μαθηματικά",
    title: "title",
    unavailable: false,
  },
];

export const Category = [
  {
    id: 0,
    name: 'Κατηγορία',
    title: "category",
    unavailable: true,
  },
  {
    id: 1,
    name: "Συναρτήσεις",
    title: "category",
    unavailable: false,
  },
  {
    id: 2,
    name: "Όρια",
    title: "category",
    unavailable: false,
  },
  {
    id: 3,
    name: "Παράγωγοι",
    title: "category",
    unavailable: false,
  },
  {
    id: 4,
    name: "Ολοκληρώματα",
    title: "category",
    unavailable: false,
  },
  {
    id: 5,
    name: "Άλγεβρα",
    title: "category",
    unavailable: false,
  },
  {
    id: 6,
    name: "Γεωμετρία",
    title: "category",
    unavailable: false,
  },
  {
    id: 7,
    name: "Μαθηματικά Προσανατολισμού",
    title: "category",
    unavailable: false,
  },
];

export const Type = [
  {
    id: 0,
    name: 'Είδος ασκήσεως',
    title: "tags",
    unavailable: true,
  },
  {
    id: 1,
    name: "Άλυτες ασκήσεις",
    title: "tags",
    unavailable: false,
  },
  {
    id: 2,
    name: "Λυμένες ασκήσεις",
    title: "tags",
    unavailable: false,
  },
  {
    id: 3,
    name: "Ερωτήσεις Επιλογής",
    title: "tags",
    unavailable: false
  },
];

export const ExerciseNavList=[
  {
    id:1,
    title:'Γ-Λυκείου',
    subTitles:[{
      id:11,
      title:'Πολλαπλής επιλογής',
      link:'?searchParam=g1',
    },{
      id:12,
      title:'Λυμένες ασκήσεις',
      link:'?searchParam=g2',
    }
  ]
  },
  {
    id:2,
    title:'Β-Λυκείου',
    subTitles:[{
      id:21,
      title:'Πολλαπλής επιλογής',
      link:'?searchParam=b1',
    },{
      id:22,
      title:'Λυμένες ασκήσεις',
      link:'?searchParam=b2',
    }
  ]
  }, 
   {
    id:3,
    title:'A-Λυκείου',
    subTitles:[{
      id:31,
      title:'Πολλαπλής επιλογής',
      link:'?searchParam=a1',
    },{
      id:32,
      title:'Λυμένες ασκήσεις',
      link:'?searchParam=a2',
    }
  ]
  }, 
   {
    id:4,
    title:'Γυμνάσιο',
    subTitles:[{
      id:41,
      title:'Πολλαπλής επιλογής',
      link:'?searchParam=s1',
    },{
      id:42,
      title:'Λυμένες ασκήσεις',
      link:'?searchParam=s2',
    }
  ]
  },
  {
    id:5,
    title:'Πανεπιστήμιο',
    subTitles:[{
      id:51,
      title:'Πολλαπλής επιλογής',
      link:'?searchParam=p1',
    },{
      id:52,
      title:'Λυμένες ασκήσεις',
      link:'?searchParam=p2',
    }
  ]
  },
]

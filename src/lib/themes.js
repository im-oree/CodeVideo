// Code token palettes (canvas + editor) and app themes.
// Categories we normalize token types to:
//  text, comment, string, keyword, func, class, number, operator,
//  punctuation, property, tag, attr, var, constant, builtin, decorator,
//  regex, bool, module, type

export const codeThemes = {
  'one-dark': {
    name: 'One Dark', bg: '#282c34', bg2: '#21252b', text: '#abb2bf', accent: '#61afef',
    comment: '#5c6370', string: '#98c379', keyword: '#c678dd', func: '#61afef',
    class: '#e5c07b', number: '#d19a66', operator: '#56b6c2', punctuation: '#abb2bf',
    property: '#e06c75', tag: '#e06c75', attr: '#d19a66', var: '#e06c75',
    constant: '#d19a66', builtin: '#56b6c2', decorator: '#61afef', regex: '#98c379',
    bool: '#d19a66', module: '#61afef', type: '#e5c07b', char: '#98c379',
  },
  dracula: {
    name: 'Dracula', bg: '#282a36', bg2: '#21222c', text: '#f8f8f2', accent: '#bd93f9',
    comment: '#6272a4', string: '#f1fa8c', keyword: '#ff79c6', func: '#50fa7b',
    class: '#8be9fd', number: '#bd93f9', operator: '#ff79c6', punctuation: '#f8f8f2',
    property: '#50fa7b', tag: '#ff79c6', attr: '#50fa7b', var: '#f8f8f2',
    constant: '#bd93f9', builtin: '#8be9fd', decorator: '#50fa7b', regex: '#ffb86c',
    bool: '#bd93f9', module: '#8be9fd', type: '#8be9fd', char: '#f1fa8c',
  },
  monokai: {
    name: 'Monokai', bg: '#272822', bg2: '#1e1f1a', text: '#f8f8f2', accent: '#66d9ef',
    comment: '#75715e', string: '#e6db74', keyword: '#f92672', func: '#a6e22e',
    class: '#a6e22e', number: '#ae81ff', operator: '#f92672', punctuation: '#f8f8f2',
    property: '#a6e22e', tag: '#f92672', attr: '#a6e22e', var: '#f8f8f2',
    constant: '#ae81ff', builtin: '#a6e22e', decorator: '#a6e22e', regex: '#ae81ff',
    bool: '#ae81ff', module: '#a6e22e', type: '#a6e22e', char: '#e6db74',
  },
  nord: {
    name: 'Nord', bg: '#2e3440', bg2: '#272c36', text: '#d8dee9', accent: '#88c0d0',
    comment: '#616e88', string: '#a3be8c', keyword: '#81a1c1', func: '#88c0d0',
    class: '#8fbcbb', number: '#b48ead', operator: '#81a1c1', punctuation: '#d8dee9',
    property: '#8fbcbb', tag: '#81a1c1', attr: '#88c0d0', var: '#d8dee9',
    constant: '#d08770', builtin: '#8fbcbb', decorator: '#88c0d0', regex: '#ebcb8b',
    bool: '#b48ead', module: '#88c0d0', type: '#8fbcbb', char: '#a3be8c',
  },
  'github-dark': {
    name: 'GitHub Dark', bg: '#0d1117', bg2: '#161b22', text: '#c9d1d9', accent: '#58a6ff',
    comment: '#8b949e', string: '#a5d6ff', keyword: '#ff7b72', func: '#d2a8ff',
    class: '#ffa657', number: '#79c0ff', operator: '#ff7b72', punctuation: '#c9d1d9',
    property: '#79c0ff', tag: '#7ee787', attr: '#79c0ff', var: '#ffa657',
    constant: '#79c0ff', builtin: '#d2a8ff', decorator: '#ff7b72', regex: '#a5d6ff',
    bool: '#79c0ff', module: '#d2a8ff', type: '#ffa657', char: '#a5d6ff',
  },
  'github-light': {
    name: 'GitHub Light', bg: '#ffffff', bg2: '#f6f8fa', text: '#24292f', accent: '#0969da',
    comment: '#6e7781', string: '#0a3069', keyword: '#cf222e', func: '#8250df',
    class: '#953800', number: '#0550ae', operator: '#cf222e', punctuation: '#24292f',
    property: '#0550ae', tag: '#116329', attr: '#0550ae', var: '#953800',
    constant: '#0550ae', builtin: '#8250df', decorator: '#953800', regex: '#0a3069',
    bool: '#0550ae', module: '#8250df', type: '#953800', char: '#0a3069',
  },
  solarized: {
    name: 'Solarized', bg: '#fdf6e3', bg2: '#eee8d5', text: '#657b83', accent: '#268bd2',
    comment: '#93a1a1', string: '#2aa198', keyword: '#859900', func: '#268bd2',
    class: '#b58900', number: '#d33682', operator: '#859900', punctuation: '#657b83',
    property: '#268bd2', tag: '#268bd2', attr: '#2aa198', var: '#b58900',
    constant: '#d33682', builtin: '#6c71c4', decorator: '#268bd2', regex: '#dc322f',
    bool: '#d33682', module: '#268bd2', type: '#b58900', char: '#2aa198',
  },
  'atom-one': {
    name: 'Atom One', bg: '#282c34', bg2: '#21252b', text: '#abb2bf', accent: '#61afef',
    comment: '#5c6370', string: '#98c379', keyword: '#c678dd', func: '#61afef',
    class: '#e5c07b', number: '#d19a66', operator: '#56b6c2', punctuation: '#abb2bf',
    property: '#e06c75', tag: '#e06c75', attr: '#d19a66', var: '#e06c75',
    constant: '#d19a66', builtin: '#56b6c2', decorator: '#61afef', regex: '#98c379',
    bool: '#d19a66', module: '#61afef', type: '#e5c07b', char: '#98c379',
  },
  'material': {
    name: 'Material', bg: '#263238', bg2: '#1e272c', text: '#eeffff', accent: '#82aaff',
    comment: '#546e7a', string: '#c3e88d', keyword: '#c792ea', func: '#82aaff',
    class: '#ffcb6b', number: '#f78c6c', operator: '#89ddff', punctuation: '#89ddff',
    property: '#82aaff', tag: '#f07178', attr: '#ffcb6b', var: '#eeffff',
    constant: '#f78c6c', builtin: '#ffcb6b', decorator: '#c792ea', regex: '#c3e88d',
    bool: '#ff5874', module: '#82aaff', type: '#ffcb6b', char: '#c3e88d',
  },
  synthwave: {
    name: 'Synthwave', bg: '#2a2139', bg2: '#241b2f', text: '#f9f1ff', accent: '#f97e72',
    comment: '#6d5a8f', string: '#fede5d', keyword: '#f97e72', func: '#fe4450',
    class: '#fede5d', number: '#ff8b39', operator: '#f97e72', punctuation: '#f9f1ff',
    property: '#72f1b8', tag: '#f97e72', attr: '#ff8b39', var: '#72f1b8',
    constant: '#ff8b39', builtin: '#fe4450', decorator: '#fe4450', regex: '#fede5d',
    bool: '#ff8b39', module: '#fe4450', type: '#fede5d', char: '#fede5d',
  },
  'gruvbox-dark': {
    name: 'Gruvbox Dark', bg: '#282828', bg2: '#1d2021', text: '#ebdbb2', accent: '#fe8019',
    comment: '#928374', string: '#b8bb26', keyword: '#fb4934', func: '#b8bb26',
    class: '#fabd2f', number: '#d3869b', operator: '#8ec07c', punctuation: '#ebdbb2',
    property: '#fe8019', tag: '#fb4934', attr: '#fabd2f', var: '#fe8019',
    constant: '#d3869b', builtin: '#8ec07c', decorator: '#fb4934', regex: '#b8bb26',
    bool: '#d3869b', module: '#fe8019', type: '#fabd2f', char: '#b8bb26',
  },
  'tokyo-night': {
    name: 'Tokyo Night', bg: '#1a1b26', bg2: '#16161e', text: '#c0caf5', accent: '#7aa2f7',
    comment: '#565f89', string: '#9ece6a', keyword: '#bb9af7', func: '#7aa2f7',
    class: '#7dcfff', number: '#ff9e64', operator: '#89ddff', punctuation: '#c0caf5',
    property: '#73daca', tag: '#f7768e', attr: '#ff9e64', var: '#f7768e',
    constant: '#ff9e64', builtin: '#7dcfff', decorator: '#bb9af7', regex: '#e0af68',
    bool: '#ff9e64', module: '#7aa2f7', type: '#7dcfff', char: '#9ece6a',
  },
};

export const appThemes = {
  dark: {
    id: 'dark', label: 'Dark', accentInverse: false,
    bg: '#0b0e14', bg2: '#12161f', surface: '#161b27', surface2: '#1d2331',
    border: 'rgba(148,163,184,.14)', text: '#e6e9f0', text2: '#9aa7bd',
    text3: '#64748b', shadow: 'rgba(0,0,0,.5)',
  },
  light: {
    id: 'light', label: 'Light', accentInverse: true,
    bg: '#f2f5fa', bg2: '#ffffff', surface: '#ffffff', surface2: '#f6f8fc',
    border: 'rgba(15,23,42,.10)', text: '#0f172a', text2: '#475569',
    text3: '#94a3b8', shadow: 'rgba(15,23,42,.16)',
  },
};

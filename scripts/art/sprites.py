import json
SH = {'e': '#1d1a22', 'W': '#ffffff', 'r': '#d6403a', 'R': '#9e2a2a', 'b': '#5a3424', 'B': '#3a2018', 'o': '#f2c14e'}
PAL = {
  'uktun': {**SH, 'H': '#5a2420', 'h': '#8e3e26', 'q': '#b25a30', 'Q': '#d27a44', 's': '#f6c8a2', 'S': '#d9997a', 'n': '#ec8f7e', 'm': '#b04652',
            'j': '#e0a23a', 'J': '#a86c1c', 'y': '#ffd884', 'p': '#3e4a7a', 'P': '#2a3256', 'X': '#f4e4c0'},
  'memo': {**SH, 'H': '#1a1210', 'h': '#2e211c', 'q': '#4a362c', 'Q': '#6a5040', 's': '#e0aa80', 'S': '#b87a58', 'n': '#c88a68', 'm': '#7a3a30',
           'G': '#3a2a22', 'g': '#5a4234', 'j': '#2f7a8a', 'J': '#1e5662', 'y': '#6cb8bc', 'p': '#3a3a4a', 'P': '#24242e', 'X': '#7ad8ff'},
}
HEAD = {
  'uktun': [
    '.....HHHHH......',
    '....HqQQqhH.....',
    '...HqQqqhhhH....',
    '...HhqhhhhhhH...',
    '...HhhSsssshH...',
    '...HhSsesssesS..',
    '...HhSsnssssns..',
    '...HhhSsssmsS...',
    '...Hhh.SSSSS....',
  ],
  'memo': [
    '.....HHHHH......',
    '....HhqQqhH.....',
    '...HhqQqqhhH....',
    '...HhhhhhhhhH...',
    '...HhSsssssSh...',
    '...HSsesssesS...',
    '...HSsssssssss..',
    '....SsGGGGsS....',
    '.....SSsgsSS....',
  ],
}
HAIR_BACK = {'uktun': ['...Hhh..........', '...Hhq..........', '....Hh..........', '....Hh..........', '.....H..........'], 'memo': []}
TORSO = {
  'idle': ['......RrrrR.....', '.....JyjjjjJ....', '.....JjjJjjJ....', '.....JjjJjjJ....', '.....sjjJjjs....', '......JjjjJ.....'],
  'runA': ['......RrrrR.....', '....JJyjjjjJ....', '...s.JyJjjJJ....', '......jjJjjJs...', '......jjJjj.....', '......JjjjJ.....'],
  'runB': ['......RrrrR.....', '.....JyjjjjJ....', '.....JjjyjJj....', '......jjJJjj....', '......jjJsj.....', '......JjjjJ.....'],
  'runC': ['......RrrrR.....', '.....JyjjjjJJ...', '.....JjjJjjjJs..', '....s.jjJjj.....', '......jjJjj.....', '......JjjjJ.....'],
  'runD': ['......RrrrR.....', '.....JyjjjjJ....', '.....jjjJJjj....', '......jjJJjj....', '......jjJsj.....', '......JjjjJ.....'],
  'jump': ['....s.RrrrR.s...', '....JJyjjjjJJ...', '......jjJjj.....', '......jjJjj.....', '......jjJjj.....', '......JjjjJ.....'],
  'fall': ['......RrrrR.....', '...JJJyjjjjJJJ..', '..s...jjJjj...s.', '......jjJjj.....', '......jjJjj.....', '......JjjjJ.....'],
  'wall': ['......RrrrR..s..', '.....JyjjjjJJJ..', '.....JjjJjjJ....', '......jjJjj.....', '......jjJjj.....', '......JjjjJ.....'],
}
LEGS = {
  'idle': ['......pPppP.....', '......pP.pP.....', '......pP.pP.....', '......pP.pP.....', '.....bbB.bbB....'],
  'runA': ['......pPPpp.....', '.....pP...pP....', '....pP.....pP...', '....pP......bB..', '...bB...........'],
  'runB': ['......pPpp......', '......pPpP......', '.......pPpP.....', '.......pP.bB....', '......bB........'],
  'runC': ['......ppPPp.....', '......pP..pP....', '.....pP....pP...', '....bB.....pP...', '...........bbB..'],
  'runD': ['.......pPp......', '......pPpP......', '.....pP.pP......', '....bB..pP......', '........bbB.....'],
  'jump': ['......pPPpp.....', '......pP..pP....', '.....bB...pP....', '..........bB....', '................'],
  'fall': ['......pPpPp.....', '.....pP...pP....', '.....pP...pP....', '....bbB...bbB...', '................'],
  'wall': ['......pPPp......', '......pP.pP.....', '......pP..bB....', '.....bbB........', '................'],
}
def frame(cid, pose):
    g = [['.'] * 16 for _ in range(20)]
    def over(rows, y0):
        for j, r in enumerate(rows):
            for i, ch in enumerate(r):
                if ch != '.' and 0 <= y0 + j < 20: g[y0 + j][i] = ch
    over(HAIR_BACK[cid], 9)
    over(TORSO[pose], 9)
    over(LEGS[pose], 15)
    over(HEAD[cid], 0)
    return [''.join(r) for r in g]
if __name__ == '__main__':
    out = [{'rows': frame(c, p), 'pal': PAL[c]} for c in ['uktun', 'memo'] for p in ['idle', 'runA', 'runC', 'jump', 'fall']]
    json.dump(out, open('frames.json', 'w'))
    json.dump({'PAL': PAL, 'HEAD': HEAD, 'HAIR_BACK': HAIR_BACK, 'TORSO': TORSO, 'LEGS': LEGS}, open('sprites.json', 'w'))

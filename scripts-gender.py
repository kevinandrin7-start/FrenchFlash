import json,re,sys
p='/root/app/src/data/words.json'
d=json.load(open(p))
# manual gender for l'/les nouns with no marker (m, f, m/f)
G={2564:'f',2612:'m/f',2657:'m',3003:'m',3133:'f',3156:'f',3157:'m',3158:'m',3272:'f',3855:'m',3865:'m',3876:'f',
3906:'m',4050:'m',4061:'f',4091:'f',4096:'f',4097:'f',4104:'f',4114:'f',4128:'m',4177:'f',4180:'f',4240:'f',4261:'m/f',
4326:'f',4338:'m',4415:'m',4737:'m',4739:'m',4753:'f',4814:'m',4891:'m',4911:'m',4912:'m',4913:'m',4999:'f',5013:'f',
5021:'f',5033:'f',5058:'m',5065:'m',5113:'m',5140:'f',5178:'m',5184:'f',5233:'m',5236:'m/f',5239:'f',5260:'f',5261:'m',
5264:'f',5314:'m',5330:'f',5337:'f',5346:'f',5361:'f',5775:'f',6100:'m',6146:'f',6159:'m',6183:'f',6184:'f',6192:'m'}
# nouns with no article: new French text
FIX={5782:"l'avocat (m) (fruit)",149:'le midi',150:'minuit (m)',154:'le lundi',155:'le mardi',156:'le mercredi',157:'le jeudi',158:'le vendredi',
159:'le samedi',160:'le dimanche',161:'janvier (m)',162:'février (m)',163:'mars (m)',164:'avril (m)',165:'mai (m)',
166:'juin (m)',167:'juillet (m)',168:'août (m)',169:'septembre (m)',170:'octobre (m)',171:'novembre (m)',172:'décembre (m)',
227:'monsieur (m)',228:'madame (f)',229:'mademoiselle (f)',3904:'les deux tiers (m)',4057:"l'assermenté / l'assermentée",
4059:'Service Canada (m)',4425:'la fin de semaine',6009:'huit jours (m)',6010:'quinze jours (m)',
6157:'Terre-Neuve-et-Labrador (f)',6169:'Immigration, Réfugiés et Citoyenneté Canada (IRCC) (m)'}
def gender(f):
    m=re.search(r"\((m/f|m|f)\)",f)
    if m: return m.group(1)
    if re.match(r"^le / la |^le .* / la ",f): return 'm/f'
    if re.match(r"^(le|un) ",f): return 'm'
    if re.match(r"^(la|une) ",f): return 'f'
    if ' / ' in f: return 'm/f'
    return None
miss=[]
for w in d:
    if w['pos']!='n': continue
    if w['id'] in FIX: w['fr']=FIX[w['id']]
    if w['id'] in G and not re.search(r"\((m|f|m/f)\)",w['fr']):
        w['fr']+=f" ({G[w['id']]})"
    g=gender(w['fr'])
    if g: w['g']=g
    else: miss.append((w['id'],w['fr']))
print('nouns without gender:',len(miss)); [print(*m) for m in miss[:60]]
if '--write' in sys.argv: json.dump(d,open(p,'w'),ensure_ascii=False,separators=(',',':'))

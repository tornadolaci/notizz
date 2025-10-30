# Project summary
Ez a leírás tartalmazza a fejlesztendő “notizz” webapplikáció terveit.

### UI szempontok:

Modern megjelenésű, reszponzív, mobile first tervezési szempontok. A webapp -nak úgy kell kinéznie, mintha egy natív IOS applikáció lenne. A feliratoknak olyan betűtípust és betűméretet kell alkalmaznia, hogy gyengébben látók is könnyen tudják használni. A felület szellős, nagy térközű, letisztult legyen, de hordozza a mostanában trendi megjelenés jegyeit: Gradiens, árnyékok, glass effekt, lebegő vezérlő elemek. Az oldalsó görgető sáv legyen letiltva.

### Nyelvi beállítás, megjelenítés
A teljes webapplikáció magyar nyelvű, a megjelnő elemek magyar nyelvi beállítást alkalmaznak.


### Reszponzivitás:
Mobile first. A szélesebb kijelzők esetében (például tabletek, PC) úgy kell az oldalt nyújtani, hogy az 1000px szélességet ne haladja meg a UI a reszponzív széthúzás közben. Szélesebb kijelzőknél az oldal tartalmát meg kell tartani 1000px szélesen, a teljes UI -t a képernyőn középre kell rendezni, a fennmaradó oldalsó széleket pedig az UI háttérszínével kell kitölteni.


### Funkciók leírása

Ez a webapp egy jegyezfüzet + TODO LIST funkcionalitású oldal lesz. A UI -en megjelenő színes panelek képviselik az egyes feljegyzéseket, amelyek lehetnek akár notes, akár todo list típusúak. Legfelül mindig az a színes panel jelenik meg, amelyen legutoljára történt bármilyen szerkesztés, aktivitás, vagy todo elem kipipálás. Az oldalon kapjon helyet egy nagy méretű, úszó “+” gomb is, amellyel létre lehet hozni az új bejegyzést. Az “új bejegyzés létrehozása” úgy nézzen ki, hogy egy szerkesztő felület nyílik, ahol:
- Meg lehet adni, hogy “Jegyzet” vagy “TODO” legyen a típus. Ez a két típus majd a főoldali paneleken is legyen megkülönböztetve akár ikonnal is, hogy az adott panel jegyzet vagy todo.
  - TODO típusnál: Legyen cím, amely vastagon fog megjelenni a főoldali panelen is. Minden hozzáadott TODO elem kapjon kipipálható jelölő négyzetet és egy törlés ikont is. Legyen szerkesztési és mentési lehetőség. A lista alján jelenjen meg egy “Szerkesztve: YYYY. MM. DD. HH:MM” utolsó szerkesztési vagy létrehozási dátum.
    Legyen lehetőség az adott todo teljes törlésére.
  - JEGYZET típusnál: Legyen cím, amely vastagon fog megjelenni a főoldali panelen is. Legyen szerkesztési és mentési lehetőség. A lista alján jelenjen meg egy “Szerkesztve: YYYY. MM. DD. HH:MM” utolsó szerkesztési vagy létrehozási dátum. Legyen lehetőség az adott jegyzet teljes törlésére.
Mentés után a todo vagy a jegyzet kap egy új színes panelt a főoldalon és legfelülre kerül.


## Struktúrális és kódírási preferencia
Törekedni kell a minél egyszerűbb felépítésre, minél kisebb kódméretre! Gyors betöltődés, jó SEO és Google Lighthouse eredmények fontosak.


## Tervezett technológiai stack:

| **Réteg**                           | **Technológia**        | **Szerepe**                                         |
|:-----------------------------------:|:----------------------:|:---------------------------------------------------:|
| **Frontend framework**              | 🟢 Svelte               | Reaktív komponens-architektúra, gyors, kis build    |
| **CSS keretrendszer**               | 🟣 Vanilla CSS          | Reszponzív design, dark/light mód előállítása       |
| **Adattárolás (strukturált)**       | 🔵 IndexedDB            | Tranzakciók, kategóriák, beállítások helyi tárolása |
| **Adattárolás (gyors kulcs-érték)** | 🟢 LocalStorage         | Felhasználói beállítások (pl. téma mód)             |
| **Build / fejlesztői eszköz**       | ⚙️ Vite + Svelte plugin | Gyors fejlesztés és PWA build                       |
| **PWA plugin**                      | 🧩 vite-plugin-pwa      | Service Worker, offline cache, telepíthetőség       |
| **Ikonok**                          | 🖼️ Material Design Icon | Kis SVG ikonok a UI terv szerint                    |
- Dátum kezelés: Natív JavaScript Date objektum segítségével
- State management: Svelte stores használata az adatok komponensek közötti megosztásához
- OFFLINE PWA -ként való működés preferált, ennek megfelelően készüljön az implementáció. A service worker óránként ellenőrizze, hogy van -e frissebb verzió (majd csak a telepített, éles környezetben)
- META: Az oldal meta neve: “Notizz”. Az oldal meta leírása: “Jegyzet és TODO lista készítő alkalmazás. Tartsd rendszerezve a teendőidet, készíts bevásárló listát! A hirtelen támadt gondolataidat azonnal feljegyzetelheted, nem fognak a felejtésbe veszni a nagyszerű ötleteid!”
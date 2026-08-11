# Ta bort dubbla lektioner

## Mål
Visa varje lektion en gång och behåll den mest kompletta posten, inklusive sal.

## Bekräftat nuläge
Kalenderflödet innehåller separata poster som motsvarar samma lokala lektionstid. Den ena posten har sal och UTC-tid, medan den andra saknar sal och använder lokal tid. Därför ser de identiska ut i Mattebo trots olika kalender-ID:n.

## Genomförande
1. Normalisera de tolkade lektionernas tider innan de visas.
2. Gruppera poster med samma årskurs, titel, lokala starttid och sluttid.
3. Behåll en enda post per grupp och prioritera den som har sal; bevara även beskrivning och effekt från den mest kompletta posten.
4. Låt lektioner med olika titel eller faktisk tid fortsätta visas separat.
5. Lägg till tester för par med/utan sal, tidszonsskillnaden och verkligt separata lektioner.
6. Verifiera Åk 7 i appen så att de dubbla raderna försvinner och salarna H1–H3 fortfarande visas.

## Teknisk detalj
Ändringen görs i kalenderparsern i frontend. Den raderar inga Google Kalender-händelser, utan skyddar Mattebo mot dubletter från nuvarande och framtida synkningar.

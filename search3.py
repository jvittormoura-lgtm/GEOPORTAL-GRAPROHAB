import urllib.request, urllib.parse, json

url = "https://html.duckduckgo.com/html/?q=" + urllib.parse.quote("site:openstreetmap.fr piano")
req = urllib.request.Request(
    url, 
    data=None, 
    headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
)

try:
    response = urllib.request.urlopen(req)
    html = response.read().decode('utf-8')
    import re
    # Extract snippets
    snippets = re.findall(r'<a class="result__snippet[^>]*>(.*?)</a>', html, re.IGNORECASE | re.DOTALL)
    for i, s in enumerate(snippets):
        s_clean = re.sub(r'<[^>]+>', '', s)
        print(f"{i}: {s_clean.strip()}")
except Exception as e:
    print(e)

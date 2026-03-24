import re

file_path = "f:/SparkConnect/landing.html"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Replace base64 logo with actual image
content = re.sub(r'src="[\./]*spark-connect-logo\.png"', 'src="public/spark-connect-logo.png"', content)
content = re.sub(r'href="[\./]*spark-connect-logo\.png"', 'href="public/spark-connect-logo.png"', content)
content = re.sub(r'src="/spark-connect-logo\.png"', 'src="public/spark-connect-logo.png"', content)
content = re.sub(r'href="/spark-connect-logo\.png"', 'href="public/spark-connect-logo.png"', content)


# 2. Replace Profiles Strip carousel with a static mosaic
new_strip = """<div id="strip" style="padding:6rem 2rem; background:var(--bg); text-align:center;">
  <span class="sec-pre" style="color:var(--gold); font-size:0.72rem; letter-spacing:0.18em; text-transform:uppercase; display:block; margin-bottom:1rem;">Odkrywaj profile</span>
  <h2 style="font-family:'Cormorant Garamond',serif; font-size:clamp(2rem, 4vw, 3.2rem); font-weight:300; margin-bottom:3rem;">Poznaj <em>prawdziwych</em> ludzi</h2>
  <div style="display:flex; flex-wrap:wrap; gap:12px; justify-content:center; max-width:900px; margin:0 auto;">
    <img src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&q=80" style="width:130px; height:130px; object-fit:cover; border-radius:14px; border:1px solid rgba(255,255,255,0.05);"/>
    <img src="https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=200&q=80" style="width:130px; height:130px; object-fit:cover; border-radius:14px; border:1px solid rgba(255,255,255,0.05);"/>
    <img src="https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=200&q=80" style="width:130px; height:130px; object-fit:cover; border-radius:14px; border:1px solid rgba(255,255,255,0.05);"/>
    <img src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&q=80" style="width:130px; height:130px; object-fit:cover; border-radius:14px; border:1px solid rgba(255,255,255,0.05);"/>
    <img src="https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=200&q=80" style="width:130px; height:130px; object-fit:cover; border-radius:14px; border:1px solid rgba(255,255,255,0.05);"/>
    <img src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200&q=80" style="width:130px; height:130px; object-fit:cover; border-radius:14px; border:1px solid rgba(255,255,255,0.05);"/>
    <img src="https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=200&q=80" style="width:130px; height:130px; object-fit:cover; border-radius:14px; border:1px solid rgba(255,255,255,0.05);"/>
    <img src="https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?w=200&q=80" style="width:130px; height:130px; object-fit:cover; border-radius:14px; border:1px solid rgba(255,255,255,0.05);"/>
    <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80" style="width:130px; height:130px; object-fit:cover; border-radius:14px; border:1px solid rgba(255,255,255,0.05);"/>
    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80" style="width:130px; height:130px; object-fit:cover; border-radius:14px; border:1px solid rgba(255,255,255,0.05);"/>
    <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80" style="width:130px; height:130px; object-fit:cover; border-radius:14px; border:1px solid rgba(255,255,255,0.05);"/>
    <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80" style="width:130px; height:130px; object-fit:cover; border-radius:14px; border:1px solid rgba(255,255,255,0.05);"/>
  </div>
</div>"""

# Remove everything between <div id="strip" class="strip-wrap"> and the end of its block <!-- ════ FEATURES + COLLAGE ════ -->
content = re.sub(r'<div id="strip" class="strip-wrap">.*?<!-- ════ FEATURES', new_strip + '\n\n<!-- ════ FEATURES', content, flags=re.DOTALL)


# 3. Replace Private Photos block
new_private = """<div class="private-sec" style="padding:6rem 2rem; background:var(--bg3); text-align:center;">
    <span class="sec-pre" style="color:var(--gold); font-size:0.72rem; letter-spacing:0.18em; text-transform:uppercase; display:block; margin-bottom:1rem;">Niezapomniane emocje</span>
    <h2 style="font-family:'Cormorant Garamond',serif; font-size:clamp(2rem, 4vw, 3.2rem); font-weight:300; margin-bottom:3rem;">Galeria <em>Społeczności</em></h2>
    <div style="display:flex; flex-wrap:wrap; gap:16px; justify-content:center; max-width:800px; margin:0 auto;">
      <img src="https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=300&q=80" style="width:180px; height:240px; object-fit:cover; border-radius:16px; border:1px solid rgba(255,255,255,0.05); filter:brightness(0.9); transition:transform 0.3s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'"/>
      <img src="https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=300&q=80" style="width:180px; height:240px; object-fit:cover; border-radius:16px; border:1px solid rgba(255,255,255,0.05); filter:brightness(0.9); transition:transform 0.3s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'"/>
      <img src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&q=80" style="width:180px; height:240px; object-fit:cover; border-radius:16px; border:1px solid rgba(255,255,255,0.05); filter:brightness(0.9); transition:transform 0.3s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'"/>
      <img src="https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?w=300&q=80" style="width:180px; height:240px; object-fit:cover; border-radius:16px; border:1px solid rgba(255,255,255,0.05); filter:brightness(0.9); transition:transform 0.3s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'"/>
    </div>
</div>"""

content = re.sub(r'<div class="private-sec">.*?<!-- ════ HOW IT WORKS ════ -->', new_private + '\n\n<!-- ════ HOW IT WORKS ════ -->', content, flags=re.DOTALL)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("done")

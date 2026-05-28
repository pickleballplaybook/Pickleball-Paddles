with open('server.js', 'r') as f:
    content = f.read()

# Find and replace the entire cropFilter line
import re
content = re.sub(r'const cropFilter = `[^`]+`;', 'const cropFilter = `scale=1920:1080`;', content)

with open('server.js', 'w') as f:
    f.write(content)

print("Done!")

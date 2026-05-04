import fs from 'fs';
import path from 'path';

const dirs = ['src/views', 'src/hooks', 'src/components', 'src/lib', 'src/contexts'];

for (const dir of dirs) {
  if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts') || f.endsWith('.tsx')).map(f => path.join(dir, f));
  for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;
    // Replace relative imports to lib/hooks/components/types/views with @/ aliases
    content = content.replace(/from '\.\.\/(lib|hooks|components|types|views)\//g, "from '@/\$1/");
    content = content.replace(/from '\.\.\/(lib|hooks|components|types|views)\//g, "from '@/\$1/");
    if (content !== original) {
      fs.writeFileSync(file, content);
      console.log('Updated', file);
    }
  }
}

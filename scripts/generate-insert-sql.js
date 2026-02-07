import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * product_json.json 파일을 읽어서 INSERT SQL을 생성하는 함수
 */
function generateInsertSQL() {
  const jsonPath = path.join(__dirname, '..', 'product_json.json');
  const products = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  // products.ts에서 누락된 데이터 보완
  const productData = {
    '1': { price: 1890000, image: '/src/assets/products/sofa.jpg' },
    '2': { price: 980000, image: '/src/assets/products/table.png' },
    '3': { price: 720000, image: '/src/assets/products/storage.jpg' },
    '4': { price: 289000, image: '/src/assets/products/lamp.jpg' },
    '5': { price: 189000, image: '/src/assets/products/sidetable.jpg' }
  };

  let sql = `-- ============================================
-- 상품 데이터 INSERT SQL
-- product_json.json 기반 (자동 생성)
-- ============================================
-- 생성 시간: ${new Date().toISOString()}

-- 기존 데이터 삭제 (선택사항 - 필요시 주석 해제)
-- DELETE FROM public.products;

INSERT INTO public.products (name, description, price, image, category, badge, stock, is_active) VALUES
`;

  const values = products.map((product, index) => {
    const id = product.id || String(index + 1);
    const price = product.price || productData[id]?.price || 0;
    const image = product.image || productData[id]?.image || null;
    const badge = product.badge ? `'${product.badge}'` : 'NULL';
    const imageValue = image ? `'${image.replace(/'/g, "''")}'` : 'NULL';
    const description = product.description 
      ? `'${product.description.replace(/'/g, "''")}'` 
      : 'NULL';

    return `    (
        '${product.name.replace(/'/g, "''")}',
        ${description},
        ${price},
        ${imageValue},
        '${product.category.replace(/'/g, "''")}',
        ${badge},
        10,
        true
    )`;
  });

  sql += values.join(',\n');
  sql += `\nON CONFLICT DO NOTHING;

-- 삽입된 데이터 확인
-- SELECT * FROM public.products ORDER BY created_at DESC;
`;

  return sql;
}

// 메인 실행
const isMainModule = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMainModule || process.argv[1]?.endsWith('generate-insert-sql.js')) {
  try {
    const sql = generateInsertSQL();
    const outputPath = path.join(__dirname, '..', 'insert_products_auto.sql');
    fs.writeFileSync(outputPath, sql, 'utf-8');
    console.log('✅ INSERT SQL이 생성되었습니다: insert_products_auto.sql');
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    process.exit(1);
  }
}

export { generateInsertSQL };


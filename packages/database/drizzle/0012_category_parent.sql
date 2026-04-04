-- Add parent_category_id for sub-category hierarchy
ALTER TABLE categories ADD COLUMN parent_category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
CREATE INDEX idx_categories_parent ON categories(parent_category_id);

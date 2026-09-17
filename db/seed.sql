-- Optional starter content so the shop isn't empty on first run.
insert into categories (name, slug, description, position) values
  ('Bags',      'bags',      'Totes and slings worked in tight single crochet, lined and ready for daily use.', 1),
  ('Wearables', 'wearables', 'Cardigans, tops and scarves in soft cotton and merino blends.',                   2),
  ('Home',      'home',      'Throws, coasters and plant hangers for corners that need softening.',             3),
  ('Amigurumi', 'amigurumi', 'Small stuffed companions, stitched closed and safety-eyed.',                      4)
on conflict (slug) do nothing;

insert into products (category_id, name, slug, summary, description, materials, dimensions, care,
                      price_paise, stock, is_made_to_order, lead_time_days, is_featured, options)
select c.id, v.name, v.slug, v.summary, v.description, v.materials, v.dimensions, v.care,
       v.price_paise, v.stock, v.mto, v.lead, v.featured, v.options::jsonb
from (values
  ('bags','Luna Market Tote','luna-market-tote',
   'A deep, unlined tote that holds a week of vegetables without stretching.',
   'Worked in a dense single crochet so the base holds its shape under weight. The handles are doubled and reinforced at the join, which is where most crochet bags give way first.',
   '100% mercerised cotton', '38 x 34 cm, 24 cm handle drop', 'Hand wash cold, dry flat.',
   189000, 3, false, null, true,
   '[{"name":"Colour","values":["Ecru","Cocoa","Mustard"]}]'),
  ('wearables','Thread Cardigan','thread-cardigan',
   'An open-front cardigan in a loose shell stitch, made to your measurements.',
   'Made to order. Send your bust and sleeve length at checkout and it is worked to fit rather than graded to a size chart.',
   'Merino and cotton blend', 'Made to measure', 'Hand wash cold, reshape while damp.',
   425000, 0, true, 21, true,
   '[{"name":"Colour","values":["Oat","Cocoa","Mustard"]},{"name":"Size","values":["S","M","L","XL"]}]'),
  ('home','Half-Moon Throw','half-moon-throw',
   'A two-seater throw in wide granny rows with a scalloped edge.',
   'Heavy enough to stay put on a sofa arm. The edging is worked last in a contrast yarn.',
   'Acrylic and cotton blend', '150 x 120 cm', 'Machine wash gentle, tumble dry low.',
   649000, 1, false, null, true,
   '[{"name":"Colour","values":["Beige","Cocoa"]}]'),
  ('amigurumi','Pocket Moon','pocket-moon',
   'A palm-sized crescent moon with an embroidered face.',
   'Stitched closed with no loose parts, so it is safe for small hands.',
   'Cotton yarn, polyfill', '12 cm tall', 'Spot clean only.',
   49000, 12, false, null, false,
   '[{"name":"Colour","values":["Ecru","Mustard"]}]')
) as v(cat, name, slug, summary, description, materials, dimensions, care,
       price_paise, stock, mto, lead, featured, options)
join categories c on c.slug = v.cat
on conflict (slug) do nothing;

// check-routes.js - Run this to see what routes are registered
const app = require('./src/app');

console.log('Registered routes:\n');

function printRoutes(stack, prefix = '') {
  stack.forEach(layer => {
    if (layer.route) {
      // This is a route
      const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
      console.log(`${methods.padEnd(8)} ${prefix}${layer.route.path}`);
    } else if (layer.name === 'router' && layer.handle.stack) {
      // This is a router, recurse with its stack
      printRoutes(layer.handle.stack, prefix + layer.regexp.source.replace('^\\', '').replace('\\/?(?=\\/|$)', '').replace(/\\/g, '/').replace('/?(?=/|$)', ''));
    }
  });
}

printRoutes(app._router.stack);

console.log('\nLooking for PUT /v1/fragments/:id route...');
const hasPutRoute = app._router.stack.some(layer => {
  if (layer.name === 'router' && layer.handle.stack) {
    return layer.handle.stack.some(subLayer => {
      if (subLayer.route) {
        return subLayer.route.methods.put && subLayer.route.path.includes(':id');
      }
      return false;
    });
  }
  return false;
});

console.log(hasPutRoute ? '✓ PUT route found' : '✗ PUT route NOT found');

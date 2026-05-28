// Desarrollo local contra API en Azure: las peticiones van al origen de ng serve
// y proxy.remote.conf.js las reenvía al host de Azure (evita CORS en el navegador).
export const environment = {
  production: false,
  serverBaseUrl: 'https://cafelab-v1-m-back-eud0eae3gkfxebah.canadacentral-01.azurewebsites.net',
  coffeeLotsEndpointPath: '/api/v1/coffee-lots',
  suppliersEndpointPath: '/api/v1/suppliers',
  roastProfileEndpointPath: '/api/v1/roast-profiles',
  coffeesEndpointPath: '/api/v1/coffees',
  defectsEndpointPath: '/api/v1/defects',
  plansEndPointPath: '/plans',
  usersEndpointPath: '/users',
  cuppingSessionsEndpointPath: '/api/v1/cupping-sessions',
  recipesEndpointPath: '/api/v1/recipes',
  portfoliosEndpointPath: '/api/v1/portfolios',
  ingredientsEndpointPath: '/api/v1/recipes/{recipeId}/ingredients',
  contactUsEndpointPath: '/contact-us',
  calibrationsEndpointPath: '/api/v1/calibrations',
  coastEndpointPath: '/api/v1/coast-productions',
  inventoryEndpointPath: '/api/v1/inventory-entries',
  iotMonitoringDataEndpointPath: '/api/v1/iot-monitoring/data',
  iotMonitoringHistoriesEndpointPath: '/api/v1/iot-monitoring/histories',
  iotMonitoringDashboardEndpointPath: '/api/v1/iot-monitoring/dashboard',
  iotMonitoringSimulatorEndpointPath: '/api/v1/iot-monitoring/simulator/generate-reading'
};

# Quatt Support Dashboard

This app is hosted on [Cloudflare pages](https://dash.cloudflare.com/980b3d2d9ff2999bf928439c0eac89c1/pages/view/quatt-support-dashboard)

## Usage

1. Run `npm install`
2. Run `npm run dev`
3. Happy coding!

## Testing with local API

If you have the Quatt-cloud mobile API running locally, you can do the following to use that instead:

1. Create a file called `.env.development.local`
2. In this file add the following: `VITE_API_BASE_PATH="http://localhost:3500/api/v1"`

## Generating the API client

```bash
npm run api:generate-client
```

The npm script uses the `generate-api-client.sh` script with the first parameter being the relative path to the Quatt cloud repository, and formats with prettier to avoid diffs in the existing generated models.

Eg. `./generate-api-client.sh ../Quatt-cloud`

This will generate the API client in `src/api-client`. If there are unresolved imports in the `src/apiClient/SupportDashboardApi.ts` or elsewhere, then you must add these missing files to `src/apiClient/.openapi-generator-ignore` to make sure that file is not ignored.

The reason that we have to do this is because `openapi-generator-cli` by default includes all models from the API in the output. And because this dashboard's source-code is publically available, we don't want to expose the complete API to the end-user. Hence, we only include the exact files we need. It would be nice if `openapi-generator-cli` did this by default as a feature based on the tags in the openAPI spec but unfortunately it doesn't do that. Alternatively, we could consider moving the complete application behind an authentication wall in the future. In that case we wouldn't have to worry about this.

### Important Note

Given that support dashboard APIs may be dependent on nested schemas, the amount of schemas you'll need to add may not seem very clear. Typically if you run the generator, and a lot of schemas have imports without related schema files likely means it's a deeply nested object that needs to be included.

## Onboarding documentation

A few onboarding tips can be found in Slite in the [Dev intro](https://quatt.slite.com/app/docs/kCmDd2zez8diqa)

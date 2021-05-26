import { api } from "@/bakta-rest-api";
import { expectOk } from "@/fetch-helper";

function jobKey(job) {
  return btoa(JSON.stringify({ jobID: job.jobID, secret: job.secret }));
}

function saveJob(job) {
  const jobs = loadJobs();
  jobs.push(job);
  saveJobs(jobs);
  return Promise.resolve(job);
}

function saveJobs(jobs) {
  const toPersist = jobs.map((j) => jobKey(j));
  window.localStorage.setItem(
    "bakta-jobs",
    JSON.stringify(Array.from(new Set(toPersist)))
  );
}

function removeJobs(jobids) {
  const jobsToKeep = loadJobs().filter(
    (job) => !jobids.some((id) => id === job.jobID)
  );
  saveJobs(jobsToKeep);
}

function loadJobs() {
  let jobs = JSON.parse(window.localStorage.getItem("bakta-jobs"));
  if (jobs === null) {
    jobs = [];
  }
  let parsed = jobs.map((x) => JSON.parse(atob(x)));
  return parsed;
}

function generateRepliconTable(replicons) {
  return replicons
    .map((x) => [x.id, x.new, x.type, x.topology, x.name].join("\t"))
    .join("\t");
}

// eslint-disable-next-line no-unused-vars
function upload(_api, job, type, data) {
  const url = job[type];
  return _api
    .upload(url, data)
    .then(expectOk)
    .then(() => Promise.resolve(job));
}

function removeUnknownJobs(listResult) {
  const toRemove = listResult.failedJobs
    .filter((j) => j.jobStatus === "NOT_FOUND")
    .map((j) => j.jobID);
  removeJobs(toRemove);
}

function loadKeys(localJobs, retrievedJobs) {
  return retrievedJobs.map((job) => {
    const localJob = localJobs.filter((j) => j.jobID == job.jobID)[0];
    job.key = jobKey(localJob);
    job.secret = localJob.secret;
    return job;
  });
}

function toJobConfig(options) {
  let s = "";
  s += "--translation-table " + options.translationTable + " ";
  if (options.dermType) {
    switch (options.dermType) {
      case "UNKNOWN":
        s += "--gram ? ";
        break;
      case "monoderm":
        s += "--gram + ";
        break;
      case "diderm":
        s += "--gram - ";
        break;
    }
  }
  if (options.minContigLength)
    s += "--min-contig-length " + options.minContigLength + " ";
  if (options.complete) s += "--complete ";
  if (options.keepContigHeaders) s += "--keep-contig-headers ";

  if (options.genus) s += '--genus "' + options.genus + '" ';
  if (options.species) s += '--species "' + options.species + '" ';
  if (options.species) s += '--strain "' + options.strain + '" ';

  if (options.locus) s += '--locus "' + options.locus + '" ';
  if (options.locus_tag) s += '--locus-tag "' + options.locus_tag + '" ';
  return s;
}

/**
 * Methods of the bakta service return a promise with either
 * the response json object or an error object if the return
 * code is not okay.
 */
const BaktaService = {
  /** Vue plugin registration */
  install: (app, options) => {
    let _api = api(options);
    app.config.globalProperties.$bakta = {
      version: function() {
        return _api.version();
      },
      // eslint-disable-next-line no-unused-vars
      /** Submits a job to the rest api */
      submit: function(request) {
        // init the job
        return _api
          .init({ name: request.jobname, repliconTableType: "tsv" })
          .then((job) => {
            // store job information to local database
            saveJob(job.job);

            const replicons = generateRepliconTable(request.replicons);
            const jobRequest = {
              job: job.job,
              config: request.options,
              jobConfigString: toJobConfig(request.options),
            };
            // upload files
            return (
              upload(_api, job, "uploadLinkFasta", request.sequence)
                .then(() => upload(_api, job, "uploadLinkReplicons", replicons))
                .then(() =>
                  upload(_api, job, "uploadLinkProdigal", request.prodigal)
                )
                // submit job
                .then(() => _api.start(jobRequest))
                .then(() => {
                  // add jobkey for further processing, really needed???
                  jobRequest.job.key = jobKey(jobRequest.job);
                  return Promise.resolve(jobRequest);
                })
            );
          });
      },
      /** Retrieves a list of all known jobs */
      jobs: function() {
        let _jobs = loadJobs();
        return _api.list({ jobs: _jobs }).then((jobs) => {
          removeUnknownJobs(jobs);
          return Promise.resolve(loadKeys(_jobs, jobs.jobs));
        });
      },
      job: function(job) {
        return _api
          .list({ jobs: [job] })
          .then((jobs) => Promise.resolve(loadKeys([job], jobs.jobs)));
      },
      result: function(job) {
        return _api.result(job);
      },
    };
  },
};

export default BaktaService;

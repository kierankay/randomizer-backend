$(getAllPastPairs()
)

$('#generate-pairs').on('submit', async function (e) {
  e.preventDefault()
  let cohort = $('#cohort').val();
  let project = $('#project').val();
  let minPairedAgo = $('#min-norepeat').val()
  let response = await axios.post('/create-pairs', {
    "cohort": cohort,
    "project": project,
    "min_paired_ago": minPairedAgo
  })
  let node = $(`<div class="row"><div class="col-12"><h2>${cohort} - ${project}</h2></div></div>`)
  for (let pair of response.data) {
    addPairToGroup(pair, node);
  }
  $(node).prependTo('#groups')
})

function addPairToGroup(pair, node) {
  for (let i = 0; i < pair.length; i++) {
    node.append(`
    <div class="col-6"><p>${pair[i].first_name} ${pair[i].last_name}</p></div>
    `)
  }
}

/* 
Expects object containing pairs from one group in format:
s1_first_name, s1_last_name, s2_first_name, s2_last_name
cohort, group_project, group_id
*/

async function getAllPastPairs() {
  let response = await axios.get('/last-groups');
  let finalResponse = [];
  let current_group = {};
  let group_id = 10000000;
  for (let pair of response.data) {
    if (pair.group_id < group_id) {
      group_id = pair.group_id
      finalResponse.push(current_group);
      current_group = {}
      current_group.cohort = pair.cohort;
      current_group.project = pair.group_project;
      current_group.id = pair.group_id;
      current_group.pairs = [];
    }
    current_group.pairs.push([{
      first_name: pair.s1_first_name,
      last_name: pair.s1_last_name
    }, {
      first_name: pair.s2_first_name,
      last_name: pair.s2_last_name
    }])
  }
  console.log(finalResponse);
  for (let obj of finalResponse) {
    if (obj.hasOwnProperty('cohort')) {
      $('#groups').append(`<div class="col-12"><h2>${obj.cohort} - ${obj.project}</h2></div>`);
      for (let pair of obj.pairs) {
        for (let student of pair) {
          $('#groups').append(`<div class="col-6"><p>${student.first_name} ${student.last_name}</p></div>`);
        }
      }
    }
  }

}
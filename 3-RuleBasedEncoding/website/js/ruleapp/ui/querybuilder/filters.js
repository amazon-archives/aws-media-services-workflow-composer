

var FILTERS = [{
    id: 'count_of_tracks',
    label: 'Container: Count of Tracks',
    type: 'string'
  }, {
    id: 'count_of_audio_streams',
    label: 'Container: Count of Audio Steams',
    type: 'integer'
  }, {
    id: 'count_of_video_streams',
    label: 'Container: Count of Video Steams',
    type: 'integer'
  }, {
    id: 'count_of_menu_streams',
    label: 'Container: Count of Menu Steams',
    type: 'integer'
  },{
    id: 'count_of_text_streams',
    label: 'Container: Count of Text Steams',
    type: 'integer'
  },{
    id: 'container_format',
    label: 'Container: Format',
    type: 'integer',
    input: 'select',
    values: {
      1: 'MPEG-4',
      2: 'QuickTime',
      3: 'Matroska',
      4: 'AVI',
      5: 'MPEG-PS',
      6: 'MPEG-TS',
      7: 'MXF',
      8: 'GXF',
      9: 'LXF',
      10: 'WMV',
      11: 'FLV',
      12: 'Real'
    },
    operators: ['equal', 'not_equal']
  },{
    id: 'container_datasize',
    label: 'Container: datasize (bytes)',
    type: 'integer'
  }, {
    id: 'container_duration(',
    label: 'Container: Duration (sec)',
    type: 'double',
    validation: {
      min: 0,
      step: 0.01
    } 
  }];

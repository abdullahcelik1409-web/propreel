abi <abi/4.0>,
include <tunables/global>

profile viseo /opt/Viseo/viseo flags=(unconfined) {
  userns,
  include if exists <local/viseo>
}

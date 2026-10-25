"""Original fictional shop field guide and customer tickets."""

TICKETS = [
    {
        "id": "porchlight",
        "title": "The Backward Porchlight",
        "customer": "Mara Mothwick",
        "description": "Mara's pumpkin lantern reads OFF when the porch is glowing. Check its cable before the trick-or-treaters arrive.",
        "suspects": ["I", "X"],
        "reward": 80,
        "penalty": 30,
        "hint": "Only identity or a bit flip is possible. A Z Lantern can separate them.",
        "chapter": "Dusk · learn the lantern",
    },
    {
        "id": "whisperphone",
        "title": "A Whisper Out of Phase",
        "customer": "Nell Nightjar",
        "description": "The cemetery caretaker's whisperphone passes every on/off check, but its midnight harmony sounds wrong.",
        "suspects": ["I", "Z"],
        "reward": 90,
        "penalty": 35,
        "hint": "A phase flip hides from Z. Prepare plus and look in the X basis.",
        "chapter": "Dusk · listen for phase",
    },
    {
        "id": "mirror-organ",
        "title": "The Mirror Organ",
        "customer": "Orla Oxblood",
        "description": "Four different hauntings can silence Orla's haunted-house organ. The audience is already queuing.",
        "suspects": ["I", "X", "Z", "Y"],
        "reward": 160,
        "penalty": 60,
        "hint": "Any of four Paulis may be present. A joint Bell reading distinguishes all four.",
        "chapter": "Nightfall · four suspects",
    },
    {
        "id": "skeleton-sign",
        "title": "The Skeleton's Exit Sign",
        "customer": "Bram Bonewell",
        "description": "Bram's dancing skeleton points visitors toward the broom cupboard instead of the exit.",
        "suspects": ["I", "X"],
        "reward": 100,
        "penalty": 40,
        "hint": "Save the references. The two suspects differ by a computational-basis flip.",
        "chapter": "Nightfall · spend carefully",
    },
    {
        "id": "fog-machine",
        "title": "Fog in the Looking Glass",
        "customer": "Fia Fenlight",
        "description": "Fia's stage fog is arriving one ghost too early. All four cable faults remain on the service card.",
        "suspects": ["I", "X", "Z", "Y"],
        "reward": 180,
        "penalty": 65,
        "hint": "Read both decoded bits. The order is reference then probe: c1c0.",
        "chapter": "Witching hour · read correlations",
    },
    {
        "id": "moon-radio",
        "title": "The Moon Radio",
        "customer": "Ivo Inkcap",
        "description": "Ivo's rooftop radio carries a clear signal, but the moonlit duet has lost its relative phase.",
        "suspects": ["I", "Z"],
        "reward": 110,
        "penalty": 40,
        "hint": "A computational-basis population check misses relative phase. Choose the X Spectroscope.",
        "chapter": "Witching hour · invisible phase",
    },
    {
        "id": "midnight-projector",
        "title": "The Last Ghost Picture",
        "customer": "Vera Veilglass",
        "description": "The cinema's midnight ghost portrait has vanished. Vera needs the cable identified, not a lucky guess.",
        "suspects": ["I", "X", "Z", "Y"],
        "reward": 200,
        "penalty": 70,
        "hint": "Local Bell marginals look identical; the decoded pair carries the fault identity.",
        "chapter": "Midnight · the last mirror",
    },
    {
        "id": "dawn-bell",
        "title": "One Bell Before Dawn",
        "customer": "Edie Emberwick",
        "description": "Edie's shop-closing bell is wired backward. Finish this last two-suspect repair before the ghosts go home.",
        "suspects": ["I", "X"],
        "reward": 120,
        "penalty": 45,
        "hint": "You only need the Z Lantern for identity versus a bit flip.",
        "chapter": "Before dawn · close the shop",
    },
]


ROUTE_TICKET_IDS = {
    "story": tuple(ticket["id"] for ticket in TICKETS),
    "bits": ("porchlight", "skeleton-sign", "dawn-bell"),
    "phase": ("whisperphone", "moon-radio"),
    "entanglement": ("mirror-organ", "fog-machine", "midnight-projector"),
}


FAULTS = [
    {
        "id": "I",
        "name": "Quiet Cable",
        "description": "Identity: the device leaves the qubit alone.",
    },
    {"id": "X", "name": "Bit Banshee", "description": "X flips computational-basis zero and one."},
    {
        "id": "Z",
        "name": "Phase Phantom",
        "description": "Z changes the relative phase, not Z-basis populations.",
    },
    {
        "id": "Y",
        "name": "Double Haunt",
        "description": "Y combines bit and phase flips, up to a global phase.",
    },
]

TOOLS = [
    {
        "id": "z",
        "name": "Z Lantern",
        "description": "Prepare zero; query the cable once; measure Z.",
        "measurement_hint": "0: I or Z. 1: X or Y.",
        "cost_tokens": 0,
    },
    {
        "id": "x",
        "name": "X Spectroscope",
        "description": "Prepare plus; query once; apply H; measure Z.",
        "measurement_hint": "0: I or X. 1: Z or Y.",
        "cost_tokens": 0,
    },
    {
        "id": "bell",
        "name": "Bell Mirror",
        "description": "Entangle a probe and reference; query q0 once; decode jointly.",
        "measurement_hint": "c1c0: 00 I, 10 X, 01 Z, 11 Y. Costs one reference token.",
        "cost_tokens": 1,
    },
]
